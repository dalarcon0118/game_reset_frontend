import { TimeMetadata, TimeIntegrityResult } from './time.types';
import { TimePolicy } from './time.policy';
import { TimeStorage } from './time.storage';
import { settings } from '@/config/settings';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TIMER_REPOSITORY');

const getMonotonicNow = (): number | null => {
    const perf = globalThis.performance;
    if (perf && typeof perf.now === 'function') {
        return perf.now();
    }
    return null;
};

const resolveTrustedClientNow = (clientNow: number, metadata: TimeMetadata): number => {
    const monotonicNow = getMonotonicNow();
    if (monotonicNow === null || typeof metadata.anchorMonotonicMs !== 'number') {
        return clientNow;
    }

    const elapsed = monotonicNow - metadata.anchorMonotonicMs;
    if (elapsed < 0) {
        return clientNow;
    }

    return metadata.lastClientTime + elapsed;
};

/**
 * Single Source of Truth for trusted time and integrity validation.
 */
export const TimerRepository = {
    /**
     * Ingests server date from HTTP header and updates synchronization metadata.
     * @param dateHeader Value of the 'Date' header from server response.
     * @param clientNow Current client time in ms (performance.now() or Date.now()).
     */
    async ingestServerDate(dateHeader: string | null, clientNow: number): Promise<void> {
        if (!dateHeader) return;

        try {
            const serverDate = new Date(dateHeader);
            if (isNaN(serverDate.getTime())) {
                log.warn('Invalid Date header received', { dateHeader });
                return;
            }

            const serverNow = serverDate.getTime();
            const offset = TimePolicy.computeOffset(serverNow, clientNow);

            const metadata: TimeMetadata = {
                lastServerTime: serverNow,
                lastClientTime: clientNow,
                anchorMonotonicMs: getMonotonicNow() ?? undefined,
                serverTimeOffset: offset,
                lastSyncAt: Date.now()
            };

            await TimeStorage.setMetadata(metadata);
            log.debug('Time synchronized with server', {
                serverTime: serverDate.toISOString(),
                offsetMs: offset
            });
        } catch (error) {
            log.error('Error ingesting server date', error);
        }
    },

    /**
     * Validates if the current device clock is trustworthy.
     * Checks for backwards movement or large jumps since last sync.
     */
    async validateIntegrity(clientNow: number): Promise<TimeIntegrityResult> {
        const metadata = await TimeStorage.getMetadata();
        if (!metadata) {
            return { status: 'ok', deltaMs: 0 };
        }

        const trustedClientNow = resolveTrustedClientNow(clientNow, metadata);
        const deviationMs = clientNow - trustedClientNow;
        const maxJumpMs = settings.timeIntegrity.maxJumpMs;
        const maxBackwardMs = settings.timeIntegrity.maxBackwardMs;

        let result: TimeIntegrityResult = { status: 'ok', deltaMs: 0 };
        if (deviationMs > maxJumpMs) {
            result = {
                status: 'jump',
                deltaMs: deviationMs,
                reason: `Clock moved forward by ${Math.round(deviationMs)}ms against trusted time`
            };
        } else if (deviationMs < -maxBackwardMs) {
            result = {
                status: 'backward',
                deltaMs: deviationMs,
                reason: `Clock moved backwards by ${Math.round(Math.abs(deviationMs))}ms against trusted time`
            };
        }

        if (result.status !== 'ok') {
            log.warn('Time integrity violation detected', {
                status: result.status,
                reason: result.reason,
                deltaMs: result.deltaMs,
                trustedClientNow,
                clientNow
            });
            return result;
        }

        await TimeStorage.setMetadata({
            ...metadata,
            lastClientTime: trustedClientNow,
            lastServerTime: TimePolicy.getTrustedNow(trustedClientNow, metadata.serverTimeOffset),
            anchorMonotonicMs: getMonotonicNow() ?? metadata.anchorMonotonicMs,
            lastSyncAt: Date.now()
        });

        return result;
    },

    /**
     * Returns the virtual server time based on stored offset.
     */
    async getTrustedNow(clientNow: number): Promise<number> {
        const metadata = await TimeStorage.getMetadata();
        if (!metadata) {
            return clientNow;
        }
        const trustedClientNow = resolveTrustedClientNow(clientNow, metadata);
        const trusted = TimePolicy.getTrustedNow(trustedClientNow, metadata.serverTimeOffset);

        log.info(`[TIMER_DEBUG] TrustedNow: ${new Date(trusted).toISOString()}`, {
            offsetMs: metadata.serverTimeOffset,
            lastSyncAt: metadata?.lastSyncAt ? new Date(metadata.lastSyncAt).toISOString() : 'Never'
        });

        return trusted;
    },

    /**
     * Formats a timestamp into a UTC YYYY-MM-DD string.
     * This ensures consistency with the anti-fraud time service (which is UTC-based).
     */
    formatUTCDate(timestamp: number): string {
        try {
            // Using toISOString() is the standard way to get UTC date parts in JS.
            // It avoids local timezone interference which is the root cause of the current bug.
            return new Date(timestamp).toISOString().split('T')[0];
        } catch (error) {
            log.error('Error formatting UTC date', { timestamp, error });
            // Fallback to a safe default if timestamp is invalid
            return '1970-01-01';
        }
    }
};
