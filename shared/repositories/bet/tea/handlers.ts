import { logger } from '@/shared/utils/logger';
import { Task, Result } from '@/shared/core';
import { IBetStorage, IBetApi } from '../bet.types';
import { notificationRepository } from '../../notification';
import { dlqRepository } from '../../dlq';
import { isServerReachable } from '@/shared/utils/network';
import { drawRepository } from '../../draw';
import { mapBackendBetToFrontend } from '../bet.mapper.backend';
import { Fx } from './types';
import { placeBetFlow, placeBatchFlow } from '../flows/place-bet.flow';
import { getBetsFlow } from '../flows/get-bets.flow';
import { syncPendingFlow } from '../flows/sync-bets.flow';
import { getFinancialSummaryFlow, getTotalsByDrawIdFlow } from '../flows/financial.flow';

const log = logger.withTag('BetSystemEffects');

export const createBetEffectHandlers = (
    storage: IBetStorage,
    api: IBetApi,
    notifySubscribers: () => void
) => {

    const handlers: Record<string, (payload: any) => any> = {

        [Fx.placeBet.type]: ({ data }: any) => {
            return placeBetFlow(data, storage, api)
                .tapError(e => log.error('PLACE_BET', e));
        },

        [Fx.placeBatch.type]: ({ data }: any) => {
            return placeBatchFlow(data, storage, api)
                .tapError(e => log.error('PLACE_BATCH', e));
        },

        [Fx.getBets.type]: ({ filters }: any) => {
            fetchAndCacheRemote(storage, api, filters, notifySubscribers).catch(() => { });
            return getBetsFlow(storage, api, filters)
                .tapError(e => log.error('GET_BETS', e));
        },

        [Fx.addPendingBet.type]: ({ bet }: any) => {
            return Task.fromPromise(() => storage.save(bet))
                .andThen(() =>
                    Task.fromPromise(() => notificationRepository.addNotification({
                        title: 'Apuesta guardada offline',
                        message: `La apuesta por ${bet.amount} se guardará localmente...`,
                        type: 'warning',
                        metadata: { betId: (bet as any).id, type: 'OFFLINE_BET' },
                        updatedAt: new Date().toISOString()
                    })))
                .tap(() => notifySubscribers())
                .tapError(e => log.error('ADD_PENDING_BET', e));
        },

        [Fx.performSync.type]: () => {
            return Task.fromPromise(() => syncPendingFlow(storage, api));
        },

        [Fx.notifySyncResult.type]: ({ result: { success, failed, successBets, failedBets } }: any) => {
            return Task.fromPromise(async () => {
                if (success > 0 && successBets && successBets.length > 0) {
                    const successCodes = successBets.join(', ');
                    const successMessage = success === 1 
                        ? `Apuesta ${successCodes} sincronizada exitosamente.`
                        : `Apuestas ${successCodes} sincronizadas exitosamente.`;
                    await notificationRepository.addNotification({
                        title: 'Sincronizacion completada',
                        message: successMessage,
                        type: 'success', 
                        metadata: { count: success, successBets, type: 'SYNC_SUCCESS' },
                        updatedAt: new Date().toISOString()
                    });
                }
                if (failed > 0 && failedBets && failedBets.length > 0) {
                    const failedCodes = failedBets.map((b: any) => b.receiptCode).join(', ');
                    const failedMessage = failed === 1
                        ? `Apuesta ${failedCodes} no se pudo sincronizar. Se reintentara mas tarde.`
                        : `Apuestas ${failedCodes} no se pudieron sincronizar. Se reintentaran mas tarde.`;
                    await notificationRepository.addNotification({
                        title: 'Error de sincronizacion',
                        message: failedMessage,
                        type: 'error', 
                        metadata: { count: failed, failedBets, type: 'SYNC_ERROR' },
                        updatedAt: new Date().toISOString()
                    });
                }
            })
                .tapError(e => log.error('NOTIFY_SYNC', e));
        },

        [Fx.reconcileOrphans.type]: () => {
            return Task.fromPromise(() => storage.getPending())
                .map(pending => pending.filter(b => b.status === 'blocked' || (b.syncContext?.attemptsCount || 0) >= 3))
                .andThen(orphans => Task.fromPromise(async () => {
                    for (const bet of orphans) {
                        await dlqRepository.add('bet', bet.externalId, bet, {
                            message: bet.syncContext?.lastError || 'Reconciliacion automatica',
                            code: 'ORPHAN_RECONCILED', status: 400, timestamp: Date.now()
                        });
                        await storage.updateStatus(bet.externalId, 'synced', {
                            syncContext: { ...bet.syncContext, attemptsCount: bet.syncContext?.attemptsCount || 1, lastError: 'Movido a DLQ', lastAttempt: Date.now() }
                        });
                    }
                }))
                .tapError(e => log.error('RECONCILE_ORPHANS', e));
        },

        [Fx.cleanup.type]: ({ today }: any) => {
            const [y, m, d] = today.split('-').map(Number);
            const threshold = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
            return Task.fromPromise(() => storage.getAll())
                .map(all => all.filter(b => b.status === 'synced' && b.timestamp < threshold))
                .andThen(toDelete => Task.fromPromise(async () => {
                    for (const bet of toDelete) await storage.delete(bet.externalId);
                    return toDelete.length;
                }))
                .tapError(e => log.error('CLEANUP', e));
        },

        [Fx.cleanupFailed.type]: ({ days }: any) => {
            const threshold = days * 86400000;
            return Task.fromPromise(() => storage.getAll())
                .map(all => all.filter(b => (b.status === 'error' || b.status === 'blocked') && (Date.now() - b.timestamp) > threshold))
                .andThen(toDelete => Task.fromPromise(async () => {
                    for (const bet of toDelete) await storage.delete(bet.externalId);
                    return toDelete.length;
                }))
                .tapError(e => log.error('CLEANUP_FAILED', e));
        },

        [Fx.recoverStuck.type]: () => {
            const recoverable = ['No ID received', 'Network request failed', 'timeout', '500', '502', '503', '504', '408'];
            return Task.fromPromise(() => storage.getPending())
                .map(pending => pending.filter(b => b.status === 'error' && recoverable.some(e => ((b as any).lastError || '').includes(e))))
                .andThen(stuck => Task.fromPromise(async () => {
                    for (const bet of stuck) await storage.updateStatus(bet.externalId, 'pending');
                    return stuck.length;
                }))
                .tapError(e => log.error('RECOVER_STUCK', e));
        },

        [Fx.resetSyncStatus.type]: ({ offlineId }: any) => {
            return Task.fromPromise(() => storage.updateStatus(offlineId, 'pending', { syncContext: undefined, lastError: undefined }))
                .tapError(e => log.error('RESET_SYNC', e));
        },

        [Fx.financialSummary.type]: ({ todayStart, structureId, defaultRate }: any) => {
            log.info('Effect Handler triggered: FINANCIAL_SUMMARY', { todayStart, structureId, defaultRate });
            return Task.fromPromise(() => getFinancialSummaryFlow(storage, todayStart, structureId, defaultRate))
                .tap(result => log.info('Effect Handler FINANCIAL_SUMMARY succeeded', { result }))
                .tapError(e => log.error('FINANCIAL_SUMMARY_ERROR', e));
        },

        [Fx.totalsByDraw.type]: ({ todayStart, structureId, defaultRate }: any) => {
            return Task.fromPromise(() => getTotalsByDrawIdFlow(storage, todayStart, structureId, defaultRate))
                .tapError(e => log.error('TOTALS_BY_DRAW', e));
        },

        [Fx.notifySubscribers.type]: () => {
            return Task.fromPromise(async () => { notifySubscribers(); });
        },
        [Fx.triggerSyncIfOnline.type]: () => {
            return Task.fromPromise(() => isServerReachable());
        },
    };

    return handlers;
};

async function fetchAndCacheRemote(storage: IBetStorage, api: IBetApi, filters: any, notify: () => void): Promise<void> {
    if (!(await isServerReachable())) return;
    await Task.fromPromise(async () => {
        const remoteRaw = await api.list(filters);
        if (remoteRaw.length > 0) {
            const betTypes = ((await drawRepository.getBetTypes(filters?.drawId || '')) as any)?.value || [];
            await storage.saveBatch(remoteRaw.map(b => ({ ...mapBackendBetToFrontend(b, betTypes), status: 'synced' as const })));
            notify();
        }
    })
        .tapError(e => log.debug('REMOTE_REFRESH', e))
        .fork();
}
