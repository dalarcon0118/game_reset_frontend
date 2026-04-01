import { Return, ret, singleton } from '@/shared/core/tea-utils/return';
import { Result } from '@/shared/core';
import { Cmd } from '@/shared/core/tea-utils/cmd';
import { BetState, BetMsg, Msg, Fx } from './types';
import { logger } from '@/shared/utils/logger';
import { match } from 'ts-pattern';
import { BetRepositoryResult, RawBetTotals } from '../bet.types';
import { BetType } from '@/types';

const log = logger.withTag('BetUpdate');

/**
 * Pure reducer — Patrón TEA puro.
 *
 * El modelo es la fuente de verdad. Los resultados de efectos
 * se guardan en el modelo. El repository suscribe a cambios
 * del modelo para resolver Promises.
 */
export function update(model: BetState, msg: BetMsg): Return<BetState, BetMsg> {
    return match<BetMsg, Return<BetState, BetMsg>>(msg)

        // =====================================================================
        // REQUESTS → disparan efectos
        // =====================================================================
        .with(Msg.placeBetRequested.type(), ({ payload: { data, resolve } }) =>
            ret(model, Cmd.effect(
                Fx.placeBet.type,
                { data },
                (res: Result<Error, BetRepositoryResult>) => Msg.betPlaced({ result: res, resolve }),
                (err: Error) => Msg.effectFailed({ effectType: Fx.placeBet.type, error: err, resolve })
            ))
        )

        .with(Msg.placeBatchRequested.type(), ({ payload: { data, resolve } }) =>
            ret(model, Cmd.effect(
                Fx.placeBatch.type,
                { data },
                (res: Result<Error, BetType[]>) => Msg.batchPlaced({ result: res, resolve }),
                (err: Error) => Msg.effectFailed({ effectType: Fx.placeBatch.type, error: err, resolve })
            ))
        )

        .with(Msg.getBetsRequested.type(), ({ payload: { filters, resolve } }) =>
            ret(model, Cmd.effect(
                Fx.getBets.type,
                { filters },
                (res: Result<Error, BetType[]>) => Msg.betsLoaded({ result: res, resolve }),
                (err: Error) => Msg.effectFailed({ effectType: Fx.getBets.type, error: err, resolve })
            ))
        )

        .with(Msg.addPendingBetRequested.type(), ({ payload: { bet, resolve } }) =>
            ret(model, Cmd.effect(
                Fx.addPendingBet.type,
                { bet },
                (res: Result<Error, void>) => Msg.pendingBetAdded({ result: res, resolve }),
                (err) => Msg.effectFailed({ effectType: Fx.addPendingBet.type, error: err, resolve })
            ))
        )

        .with(Msg.syncRequested.type(), ({ payload: { resolve } }) => {
            if (model.syncStatus === 'SYNCING') {
                if (resolve) resolve(Result.ok({ success: 0, failed: 0 }));
                return singleton(model);
            }
            return ret(
                { ...model, syncStatus: 'SYNCING' as const },
                Cmd.effect(
                    Fx.performSync.type,
                    {},
                    (res: Result<Error, { success: number; failed: number }>) => Msg.syncCompleted({ result: res, resolve }),
                    (err) => Msg.effectFailed({ effectType: Fx.performSync.type, error: err, resolve })
                )
            );
        })

        .with(Msg.cleanupRequested.type(), ({ payload: { today, resolve } }) =>
            ret(model, Cmd.effect(
                Fx.cleanup.type,
                { today },
                (res: Result<Error, number>) => Msg.cleanupCompleted({ result: res, resolve }),
                (err) => Msg.effectFailed({ effectType: Fx.cleanup.type, error: err, resolve })
            ))
        )

        .with(Msg.cleanupFailedRequested.type(), ({ payload: { days, resolve } }) =>
            ret(model, Cmd.effect(
                Fx.cleanupFailed.type,
                { days },
                (res: Result<Error, number>) => Msg.cleanupFailed({ result: res, resolve }),
                (err) => Msg.effectFailed({ effectType: Fx.cleanupFailed.type, error: err, resolve })
            ))
        )

        .with(Msg.recoverStuckRequested.type(), ({ payload: { resolve } }) =>
            ret(model, Cmd.effect(
                Fx.recoverStuck.type,
                {},
                (res: Result<Error, number>) => Msg.recoverStuckCompleted({ result: res, resolve }),
                (err) => Msg.effectFailed({ effectType: Fx.recoverStuck.type, error: err, resolve })
            ))
        )

        .with(Msg.resetSyncStatusRequested.type(), ({ payload: { offlineId, resolve } }) =>
            ret(model, Cmd.effect(
                Fx.resetSyncStatus.type,
                { offlineId },
                (res: Result<Error, void>) => Msg.resetSyncStatusCompleted({ result: res, resolve }),
                (err) => Msg.effectFailed({ effectType: Fx.resetSyncStatus.type, error: err, resolve })
            ))
        )

        .with(Msg.financialSummaryRequested.type(), ({ payload: { todayStart, structureId, defaultRate, resolve } }) => {
            log.info('Processing financialSummaryRequested', { todayStart, structureId, defaultRate });
            return ret(model, Cmd.effect(
                Fx.financialSummary.type,
                { todayStart, structureId, defaultRate },
                (res: Result<Error, RawBetTotals>) => Msg.financialSummaryLoaded({ result: res, resolve }),
                (err: unknown) => Msg.effectFailed({ effectType: Fx.financialSummary.type, error: err, resolve })
            ));
        })

        .with(Msg.totalsByDrawRequested.type(), ({ payload: { todayStart, structureId, defaultRate, resolve } }) =>
            ret(model, Cmd.effect(
                Fx.totalsByDraw.type,
                { todayStart, structureId, defaultRate },
                (res: Result<Error, Record<string, RawBetTotals>>) => Msg.totalsByDrawLoaded({ result: res, resolve }),
                (err: unknown) => Msg.effectFailed({ effectType: Fx.totalsByDraw.type, error: err, resolve })
            ))
        )

        // =====================================================================
        // RESULTS → Resolve callbacks instead of storing in model
        // =====================================================================
        .with(Msg.betPlaced.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            if (result.isOk()) {
                return ret(model, Cmd.effect(Fx.triggerSyncIfOnline.type, {}, (isOnline: boolean) => Msg.onlineStatusChecked({ isOnline }), () => Msg.noOp()));
            }
            return singleton(model);
        })

        .with(Msg.batchPlaced.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            if (result.isOk()) {
                return ret(model, Cmd.effect(Fx.triggerSyncIfOnline.type, {}, (isOnline: boolean) => Msg.onlineStatusChecked({ isOnline }), () => Msg.noOp()));
            }
            return singleton(model);
        })

        .with(Msg.betsLoaded.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            return singleton(model);
        })

        .with(Msg.syncCompleted.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            if (result.isError()) {
                return ret({ ...model, syncStatus: 'IDLE' as const }, Cmd.none);
            }
            return ret(
                { ...model, syncStatus: 'IDLE' as const, lastSyncResult: result.value },
                Cmd.batch([
                    Cmd.effect(Fx.notifySyncResult.type, { result: result.value }, () => Msg.noOp(), () => Msg.noOp()),
                    Cmd.effect(Fx.notifySubscribers.type, {}, () => Msg.noOp(), () => Msg.noOp()),
                ])
            );
        })

        .with(Msg.cleanupCompleted.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            return singleton(model);
        })

        .with(Msg.cleanupFailed.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            return singleton(model);
        })

        .with(Msg.financialSummaryLoaded.type(), ({ payload: { result, resolve } }) => {
            log.info('financialSummaryLoaded message processed', { isOk: result.isOk() });
            if (resolve) resolve(result);
            return singleton(model);
        })

        .with(Msg.totalsByDrawLoaded.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            return singleton(model);
        })

        // =====================================================================
        // EFFECT FAILED → handler global de errores
        // =====================================================================
        .with(Msg.effectFailed.type(), ({ payload: { effectType, error, resolve } }) => {
            log.error(`Effect failed: ${effectType}`, error);
            if (resolve) resolve(Result.error(error instanceof Error ? error : new Error(String(error))));
            if (effectType === Fx.performSync.type) {
                return ret({ ...model, syncStatus: 'IDLE' as const }, Cmd.none);
            }
            return singleton(model);
        })

        // =====================================================================
        // RESULTADOS DE MANTENIMIENTO
        // =====================================================================
        .with(Msg.recoverStuckCompleted.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            return singleton(model);
        })
        .with(Msg.resetSyncStatusCompleted.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            return singleton(model);
        })
        .with(Msg.pendingBetAdded.type(), ({ payload: { result, resolve } }) => {
            if (resolve) resolve(result);
            return singleton(model);
        })

        // =====================================================================
        // OTROS
        // =====================================================================
        .with(Msg.externalStorageChanged.type(), () =>
            ret(model, Cmd.effect(Fx.notifySubscribers.type, {}, () => Msg.noOp(), () => Msg.noOp()))
        )

        .with(Msg.maintenanceCompleted.type(), () =>
            ret(model, Cmd.effect(Fx.reconcileOrphans.type, {}, () => Msg.noOp(), () => Msg.noOp()))
        )

        .with(Msg.onlineStatusChecked.type(), ({ payload }) => {
            if (payload.isOnline) {
                return ret(model, Cmd.ofMsg(Msg.syncRequested({})));
            }
            return singleton(model);
        })

        .with(Msg.noOp.type(), () => singleton(model))

        .exhaustive();
}
