import { TimeMetadata, TimeIntegrityResult } from './time.types';

/**
 * Pure functions for time synchronization and integrity policies.
 * No side effects, easy to test.
 */
export const TimePolicy = {
    /**
     * Computes the server time offset.
     * Offset = ServerTime - ClientTime
     */
    computeOffset(serverNow: number, clientNow: number): number {
        return serverNow - clientNow;
    },

    /**
     * Creates new synchronization metadata.
     */
    createMetadata(params: {
        serverNow: number;
        clientNow: number;
        systemNow: number;
    }): TimeMetadata {
        const offset = this.computeOffset(params.serverNow, params.clientNow);
        return {
            lastServerTime: params.serverNow,
            lastClientTime: params.clientNow,
            serverTimeOffset: offset,
            lastSyncAt: params.systemNow
        };
    },

    /**
     * Evaluates integrity based on the difference since last sync.
     * If the current client time is BEFORE the last recorded sync time, it's a backward fraud.
     */
    evaluateIntegrity(
        currentClient: number,
        metadata: TimeMetadata | null,
        config: { maxJumpMs: number; maxBackwardMs: number }
    ): TimeIntegrityResult {
        if (!metadata) {
            return { status: 'ok', deltaMs: 0 };
        }

        const elapsedSinceSync = currentClient - metadata.lastClientTime;

        // 1. Detección de Retroceso (Fraude): El reloj del cliente está antes que el ancla del servidor
        if (elapsedSinceSync < -config.maxBackwardMs) {
            return {
                status: 'backward',
                deltaMs: elapsedSinceSync,
                reason: `Clock manipulated backwards by ${Math.abs(elapsedSinceSync)}ms since last sync`
            };
        }

        // 2. Detección de Salto (Fraude): El reloj del cliente saltó demasiado hacia adelante
        if (elapsedSinceSync > config.maxJumpMs) {
            return {
                status: 'jump',
                deltaMs: elapsedSinceSync,
                reason: `Unexpected clock jump of ${elapsedSinceSync}ms since last sync`
            };
        }

        return { status: 'ok', deltaMs: elapsedSinceSync };
    },

    /**
     * Calculates the trusted virtual server time based on last sync.
     */
    getTrustedNow(currentClient: number, metadata: TimeMetadata): number {
        const elapsed = currentClient - metadata.lastClientTime;
        // TrustedTime = LastServerTime + RealElapsedTime
        return metadata.lastServerTime + elapsed;
    },

    /**
     * Formats a timestamp into a UTC YYYY-MM-DD string.
     */
    formatUTCDate(timestamp: number): string {
        try {
            return new Date(timestamp).toISOString().split('T')[0];
        } catch (error) {
            return '1970-01-01';
        }
    }
};
