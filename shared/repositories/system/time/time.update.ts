import { Return, ret, singleton } from '@/shared/core/tea-utils/return';
import { Cmd } from '@/shared/core/tea-utils/cmd';
import { RemoteData } from '@/shared/core/tea-utils/remote.data';
import { TimeModel, TimeMetadata, TimeIntegrityResult } from './time.types';
import { Msg } from './time.msg';
import { TimeStorage } from './time.storage';
import { settings } from '@/config/settings';

/**
 * Pure Business Rules for Time Integrity.
 * Consolidated here to ensure zero side effects and absolute purity.
 */
export const TimePolicy = {
    computeOffset(serverNow: number, clientNow: number): number {
        return serverNow - clientNow;
    },

    getMonotonicNow(): number | undefined {
        const perf = globalThis.performance;
        if (perf && typeof perf.now === 'function') {
            return perf.now();
        }
        return undefined;
    },

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
            lastSyncAt: params.systemNow,
            lastKnownGoodServerTime: params.serverNow
        };
    },

    evaluateIntegrity(
        currentClient: number,
        metadata: TimeMetadata | null,
        config: { maxJumpMs: number; maxBackwardMs: number },
        currentMonotonic?: number
    ): TimeIntegrityResult {
        if (!metadata) {
            return { status: 'ok', deltaMs: 0 };
        }

        // 1. Cross-Session Backward Check (Last Known Good Time)
        // Si el tiempo actual confiable (calculado) es menor que el último tiempo bueno conocido en disco,
        // hay una manipulación de reloj entre sesiones o un borrado de caché selectivo.
        if (metadata.lastKnownGoodServerTime) {
            const currentTrustedServerTime = this.getTrustedNow(currentClient, metadata);
            if (currentTrustedServerTime < metadata.lastKnownGoodServerTime - config.maxBackwardMs) {
                return {
                    status: 'backward',
                    deltaMs: currentTrustedServerTime - metadata.lastKnownGoodServerTime,
                    reason: `Cross-session manipulation detected: Current trusted time is behind Last Known Good Time`
                };
            }
        }

        // 2. Dual-Anchor Validation (Reloj Monotónico)
        if (typeof metadata.anchorMonotonicMs === 'number' && typeof currentMonotonic === 'number') {
            const elapsedHardware = currentMonotonic - metadata.anchorMonotonicMs;
            const elapsedSystem = currentClient - metadata.lastClientTime;
            const clockDrift = elapsedHardware - elapsedSystem;

            if (clockDrift > config.maxBackwardMs) {
                return {
                    status: 'backward',
                    deltaMs: -clockDrift,
                    reason: `System clock manipulated backwards by ${Math.round(clockDrift)}ms relative to hardware clock`
                };
            }

            if (clockDrift < -config.maxJumpMs) {
                return {
                    status: 'jump',
                    deltaMs: Math.abs(clockDrift),
                    reason: `System clock jumped forward by ${Math.round(Math.abs(clockDrift))}ms relative to hardware clock`
                };
            }

            return { status: 'ok', deltaMs: elapsedHardware };
        }

        // 2. Fallback: Validación Legacy (Reloj de Pared)
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

    getTrustedNow(currentClient: number, metadata: TimeMetadata): number {
        const elapsed = currentClient - metadata.lastClientTime;
        return metadata.lastServerTime + elapsed;
    },

    formatUTCDate(timestamp: number): string {
        try {
            return new Date(timestamp).toISOString().split('T')[0];
        } catch (error) {
            return '1970-01-01';
        }
    }
};

export const init = (): Return<TimeModel, Msg> => {
    return ret(
        {
            metadata: RemoteData.notAsked<string, TimeMetadata>(),
            status: 'ok',
        },
        Cmd.task({
            task: () => TimeStorage.getMetadata(),
            onSuccess: (data) => Msg.metadataLoaded(data as TimeMetadata | null),
            onFailure: (err) => Msg.errorOccurred(String(err)),
            label: 'LoadTimeMetadata'
        })
    );
};

export const update = (msg: Msg, model: TimeModel): Return<TimeModel, Msg> => {
    switch (msg.type) {
        case 'SERVER_DATE_RECEIVED': {
            const { dateHeader, clientNow, systemNow } = msg.payload;
            if (!dateHeader) return singleton(model);

            const serverDate = new Date(dateHeader);
            if (isNaN(serverDate.getTime())) return singleton(model);

            const serverNow = serverDate.getTime();
            const nextMetadata = TimePolicy.createMetadata({
                serverNow,
                clientNow,
                systemNow,
                monotonicNow: TimePolicy.getMonotonicNow()
            });

            return ret(
                { ...model, metadata: RemoteData.success<string, TimeMetadata>(nextMetadata) },
                Cmd.task({
                    task: () => TimeStorage.setMetadata(nextMetadata, { forcePersist: true }),
                    onSuccess: () => Msg.metadataSaved(),
                    onFailure: (err) => Msg.errorOccurred(String(err)),
                    label: 'SaveTimeMetadata'
                })
            );
        }

        case 'METADATA_LOADED': {
            const payload = msg.payload;
            return singleton({
                ...model,
                metadata: payload ? RemoteData.success<string, TimeMetadata>(payload) : RemoteData.notAsked<string, TimeMetadata>()
            });
        }

        case 'VALIDATE_INTEGRITY': {
            const { clientNow } = msg.payload;

            if (model.metadata.type === 'Success') {
                const metadata = model.metadata.data;
                const result = TimePolicy.evaluateIntegrity(
                    clientNow,
                    metadata,
                    {
                        maxJumpMs: settings.timeIntegrity.maxJumpMs,
                        maxBackwardMs: settings.timeIntegrity.maxBackwardMs
                    },
                    TimePolicy.getMonotonicNow()
                );

                // Si la integridad es OK, actualizamos el Last Known Good Time en el modelo y persistimos
                if (result.status === 'ok') {
                    const trustedNow = TimePolicy.getTrustedNow(clientNow, metadata);
                    const nextMetadata: TimeMetadata = {
                        ...metadata,
                        lastKnownGoodServerTime: Math.max(metadata.lastKnownGoodServerTime || 0, trustedNow)
                    };

                    return ret(
                        {
                            ...model,
                            status: 'ok',
                            metadata: RemoteData.success<string, TimeMetadata>(nextMetadata)
                        },
                        Cmd.batch([
                            Cmd.ofMsg(Msg.integrityValidated(result)),
                            Cmd.task({
                                task: () => TimeStorage.setMetadata(nextMetadata),
                                onSuccess: () => Msg.metadataSaved(),
                                onFailure: (err) => Msg.errorOccurred(String(err)),
                                label: 'UpdateLastKnownGoodTime'
                            })
                        ])
                    );
                }

                return ret(
                    { ...model, status: result.status },
                    Cmd.ofMsg(Msg.integrityValidated(result))
                );
            }

            return ret(
                { ...model, status: 'ok' as const },
                Cmd.ofMsg(Msg.integrityValidated({ status: 'ok', deltaMs: 0 }))
            );
        }

        case 'INTEGRITY_VALIDATED': {
            return singleton({ ...model, status: msg.payload.status });
        }

        case 'METADATA_SAVED':
            return singleton(model);

        case 'ERROR_OCCURRED':
            return singleton({ ...model, lastError: msg.payload });

        default:
            return singleton(model);
    }
};
