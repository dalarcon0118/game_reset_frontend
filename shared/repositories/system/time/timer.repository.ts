import { TimeMetadata, TimeIntegrityResult } from './time.types';
import { TimePolicy } from './time.policy';
import { TimeStorage } from './time.storage';
import { settings } from '@/config/settings';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TIMER_REPOSITORY');

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

        const result = TimePolicy.evaluateIntegrity(clientNow, metadata, {
            maxJumpMs: settings.timeIntegrity.maxJumpMs,
            maxBackwardMs: settings.timeIntegrity.maxBackwardMs
        });

        if (result.status !== 'ok') {
            log.warn('Time integrity violation detected', { 
                status: result.status, 
                reason: result.reason,
                deltaMs: result.deltaMs
            });
        }

        // Update lastClientTime even if it's just a regular tick to keep track of activity
        // but only if it's moving forward normally.
        if (result.status === 'ok') {
            await TimeStorage.setMetadata({
                ...metadata,
                lastClientTime: clientNow
            });
        }

        return result;
    },

    /**
     * Returns the virtual server time based on stored offset.
     */
    async getTrustedNow(clientNow: number): Promise<number> {
        const metadata = await TimeStorage.getMetadata();
        const offset = metadata?.serverTimeOffset || 0;
        return TimePolicy.getTrustedNow(clientNow, offset);
    }
};
