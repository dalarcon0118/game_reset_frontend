import { createTimeStore, selectTimeMetadata, selectTimeStatus, TimeStore } from './time.store';
import { Msg } from './time.msg';
import { TimePolicy } from './time.update';
import { TimeIntegrityResult, TimeMetadata } from './time.types';
import { settings } from '@/config/settings';

/**
 * Port for Time Ingestion (used by HTTP Client)
 */
export interface TimeSyncPort {
    ingestServerDate(dateHeader: string | null, clientNow: number): Promise<void>;
}

/**
 * Port for Time Integrity Validation (used by Business Rules)
 */
export interface TimeIntegrityPort {
    validateIntegrity(clientNow: number): TimeIntegrityResult;
    evaluateIntegrity(
        clientNow: number,
        metadata: TimeMetadata | null,
        config: { maxJumpMs: number; maxBackwardMs: number }
    ): TimeIntegrityResult;
    getStatus(): 'ok' | 'backward' | 'jump';
}

/**
 * Port for Trusted Time (used by Business Rules)
 */
export interface TrustedClockPort {
    getTrustedNow(clientNow: number): number;
}

/**
 * Aggregated interface for the Time Repository
 */
export interface ITimeRepository extends TimeSyncPort, TimeIntegrityPort, TrustedClockPort { }

/**
 * Factory for Time Repository using TEA Store.
 * Encapsulates the store instance to avoid global exposure.
 */
export const createTimerRepository = (store?: TimeStore): ITimeRepository => {
    const internalStore = store ?? createTimeStore();
    const dispatch = (msg: Msg) => internalStore.getState().dispatch(msg);

    return {
        // --- TimeSyncPort ---
        ingestServerDate: async (dateHeader: string | null, clientNow: number) => {
            dispatch(Msg.serverDateReceived({
                dateHeader,
                clientNow,
                systemNow: Date.now()
            }));
        },

        // --- TimeIntegrityPort ---
        validateIntegrity: (clientNow: number): TimeIntegrityResult => {
            const state = internalStore.getState();
            const metadata = selectTimeMetadata(state);

            if (metadata.type !== 'Success') {
                return { status: 'ok', deltaMs: 0 };
            }

            const currentMonotonic = TimePolicy.getMonotonicNow();

            const result = TimePolicy.evaluateIntegrity(
                clientNow,
                metadata.data,
                {
                    maxJumpMs: settings.timeIntegrity.maxJumpMs,
                    maxBackwardMs: settings.timeIntegrity.maxBackwardMs
                },
                currentMonotonic
            );

            // Notificamos al store si hay una violación para cambiar el estado global de 'status'
            if (result.status !== 'ok') {
                dispatch(Msg.integrityValidated(result));
            }

            return result;
        },

        evaluateIntegrity: (clientNow, metadata, config) => {
            return TimePolicy.evaluateIntegrity(
                clientNow,
                metadata,
                config,
                TimePolicy.getMonotonicNow()
            );
        },

        getStatus: () => selectTimeStatus(internalStore.getState()),

        // --- TrustedClockPort ---
        getTrustedNow: (clientNow: number): number => {
            const state = internalStore.getState();
            const metadata = selectTimeMetadata(state);
            if (metadata.type !== 'Success') {
                return clientNow;
            }
            return TimePolicy.getTrustedNow(clientNow, metadata.data);
        }
    };
};

/**
 * Default instance for shared use.
 */
export const TimerRepository = createTimerRepository();
