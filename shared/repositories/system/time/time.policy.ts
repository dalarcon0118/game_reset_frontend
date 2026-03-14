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
        monotonicNow?: number;
    }): TimeMetadata {
        const offset = this.computeOffset(params.serverNow, params.clientNow);
        return {
            lastServerTime: params.serverNow,
            lastClientTime: params.clientNow,
            serverTimeOffset: offset,
            anchorMonotonicMs: params.monotonicNow,
            lastSyncAt: params.systemNow
        };
    },

    /**
     * Evaluates integrity based on the difference since last sync.
     * Uses Dual-Anchor (System Clock + Monotonic Hardware Clock) to prevent false positives.
     */
    evaluateIntegrity(
        currentClient: number,
        metadata: TimeMetadata | null,
        config: { maxJumpMs: number; maxBackwardMs: number },
        currentMonotonic?: number
    ): TimeIntegrityResult {
        if (!metadata) {
            return { status: 'ok', deltaMs: 0 };
        }

        // 1. Dual-Anchor Validation (Reloj Monotónico)
        // Si tenemos ancla monotónica y reloj monotónico actual, validamos la deriva real.
        if (typeof metadata.anchorMonotonicMs === 'number' && typeof currentMonotonic === 'number') {
            const elapsedHardware = currentMonotonic - metadata.anchorMonotonicMs;
            const elapsedSystem = currentClient - metadata.lastClientTime;
            
            // La deriva es la diferencia entre cuánto dice el hardware que pasó vs el sistema
            const clockDrift = elapsedHardware - elapsedSystem;

            // Fraude de Retroceso: El sistema se movió hacia atrás significativamente respecto al hardware
            if (clockDrift > config.maxBackwardMs) {
                return {
                    status: 'backward',
                    deltaMs: -clockDrift,
                    reason: `System clock manipulated backwards by ${Math.round(clockDrift)}ms relative to hardware clock`
                };
            }

            // Fraude de Salto: El sistema saltó hacia adelante significativamente respecto al hardware
            if (clockDrift < -config.maxJumpMs) {
                return {
                    status: 'jump',
                    deltaMs: Math.abs(clockDrift),
                    reason: `System clock jumped forward by ${Math.round(Math.abs(clockDrift))}ms relative to hardware clock`
                };
            }

            // Si el hardware confirma que el tiempo transcurrido es coherente, ignoramos umbrales de inactividad
            return { status: 'ok', deltaMs: elapsedHardware };
        }

        // 2. Fallback: Validación Legacy (Reloj de Pared)
        // Usado tras reinicios de app o si el hardware no está disponible.
        const elapsedSinceSync = currentClient - metadata.lastClientTime;

        if (elapsedSinceSync < -config.maxBackwardMs) {
            return {
                status: 'backward',
                deltaMs: elapsedSinceSync,
                reason: `Legacy check: Clock manipulated backwards by ${Math.abs(elapsedSinceSync)}ms`
            };
        }

        if (elapsedSinceSync > config.maxJumpMs) {
            return {
                status: 'jump',
                deltaMs: elapsedSinceSync,
                reason: `Legacy check: Unexpected clock jump of ${elapsedSinceSync}ms (No hardware anchor)`
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
