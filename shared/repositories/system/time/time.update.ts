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

    evaluateIntegrity(
        currentClient: number,
        metadata: TimeMetadata | null,
        config: { maxJumpMs: number; maxBackwardMs: number }
    ): TimeIntegrityResult {
        if (!metadata) {
            return { status: 'ok', deltaMs: 0 };
        }

        const elapsedSinceSync = currentClient - metadata.lastClientTime;

        // 1. Detección de Retroceso (Fraude)
        if (elapsedSinceSync < -config.maxBackwardMs) {
            return {
                status: 'backward',
                deltaMs: elapsedSinceSync,
                reason: `Clock manipulated backwards by ${Math.abs(elapsedSinceSync)}ms since last sync`
            };
        }

        // 2. Detección de Salto (Fraude)
        if (elapsedSinceSync > config.maxJumpMs) {
            return {
                status: 'jump',
                deltaMs: elapsedSinceSync,
                reason: `Unexpected clock jump of ${elapsedSinceSync}ms since last sync`
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
                systemNow
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
                const result = TimePolicy.evaluateIntegrity(clientNow, metadata, {
                    maxJumpMs: settings.timeIntegrity.maxJumpMs,
                    maxBackwardMs: settings.timeIntegrity.maxBackwardMs
                });

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
