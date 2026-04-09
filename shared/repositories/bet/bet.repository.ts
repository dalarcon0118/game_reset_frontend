import { Result } from '@/shared/core';
import {
    IBetRepository, BetRepositoryResult, BetDomainModel, ChildStructure,
    ListeroDetails, BetPlacementInput, RawBetTotals, IBetStorage, IBetApi, ListBetsFilters
} from './bet.types';
import { BetType } from '@/types';
import { offlineEventBus } from '@core/offline-storage/instance';
import { createElmStore } from '@/shared/core/tea';
import { logger } from '@/shared/utils/logger';
import { BET_LOG_TAGS, BET_LOGS, BET_VALUES } from './bet.constants';

// TEA
import { BetState, initialModel, Msg, Fx } from './tea/types';
import { update } from './tea/update';
import { createBetEffectHandlers } from './tea/handlers';

// Sync
import { BetOfflineAdapter } from './adapters/bet.offline.adapter';
import { BetApiAdapter } from './adapters/bet.api.adapter';
import { BetSyncListener } from './sync/bet.sync.listener';
import { BetPushStrategy } from './sync/bet.push.strategy';
import { EffectRegistry } from '@/shared/core/tea-utils/effect_registry';
import { wrapLocalEffectHandlers } from './tea/local-effect-wrapper';
import { syncWorker } from '@core/offline-storage/instance';

// Notifications
import { notificationRepository } from '@/shared/repositories/notification';

/**
 * BetRepository — Fachada TEA.
 *
 * Patrón: Flujo unidireccional y determinista.
 * El Repository emite mensajes inyectando un callback `resolve`.
 * El motor TEA (Update -> Handlers) procesa la acción y llama al `resolve`
 * de forma aislada, evitando por completo las condiciones de carrera.
 */
const log = logger.withTag(BET_LOG_TAGS.REPOSITORY);

export const createBetRepository = (
    storage: IBetStorage,
    api: IBetApi
): IBetRepository => {
    const subscribers: Set<() => void> = new Set();

    const notifySubscribers = () => subscribers.forEach(cb => { try { cb(); } catch (e) { } });

    const baseHandlers = createBetEffectHandlers(storage, api, notifySubscribers);
    const effectHandlers = wrapLocalEffectHandlers(baseHandlers);

    // Register bet handlers globally so the engine's EFFECT wrapper can find them
    EffectRegistry.register({
        namespace: '', // No namespace to match existing direct Fx types
        handlers: baseHandlers
    });

    const store = createElmStore({
        name: 'BetSystemStore',
        initial: initialModel,
        update,
        effectHandlers, // Usa el wrapper local para esquivar la condición de carrera
    });

    const dispatch = store.getState().dispatch;

    // Event Bus
    offlineEventBus.subscribe((event) => {
        const isBetSync = (event.type === 'SYNC_ITEM_SUCCESS' || event.type === 'SYNC_ITEM_ERROR') && event.entity === 'bet';
        const isBetChange = event.type === 'ENTITY_CHANGED' && event.entity?.includes('bet');
        if (isBetSync || isBetChange) dispatch(Msg.externalStorageChanged());
        if (event.type === 'MAINTENANCE_COMPLETED') dispatch(Msg.maintenanceCompleted());
    });

    const syncListener = new BetSyncListener(storage, notificationRepository);
    syncListener.start();

    // Registrar estrategia de sincronización para el worker global
    syncWorker.registerStrategy('bet', new BetPushStrategy());

    return {
        onBetChanged: (callback: () => void) => {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        },

        placeBet: async (betData: BetPlacementInput) => {
            return new Promise<Result<Error, BetRepositoryResult>>(resolve => {
                dispatch(Msg.placeBetRequested({ data: betData, resolve }));
            });
        },

        placeBatch: async (bets: BetPlacementInput[]) => {
            return new Promise<Result<Error, BetType[]>>(resolve => {
                dispatch(Msg.placeBatchRequested({ data: bets, resolve }));
            });
        },

        getBets: async (filters?: ListBetsFilters) => {
            const timeoutMs = BET_VALUES.GET_BETS_TIMEOUT_MS;
            const mainPromise = new Promise<Result<Error, BetType[]>>(resolve => {
                dispatch(Msg.getBetsRequested({ filters, resolve }));
            });
            const timeoutPromise = new Promise<Result<Error, BetType[]>>(resolve =>
                setTimeout(() => {
                    log.warn(`${BET_LOGS.GET_BETS_TIMEOUT} after ${timeoutMs}ms, returning error`);
                    resolve(Result.error(new Error('TIMEOUT')));
                }, timeoutMs)
            );
            return Promise.race([mainPromise, timeoutPromise]);
        },

        getBetsOfflineFirst: async (filters?: ListBetsFilters) => {
            const timeoutMs = 1000;
            const storageFilters: any = {};
            if (filters?.drawId) storageFilters.drawId = filters.drawId;
            if (filters?.receiptCode) storageFilters.receiptCode = filters.receiptCode;
            if (filters?.date) {
                storageFilters.date = typeof filters.date === 'number'
                    ? filters.date
                    : new Date(filters.date).getTime();
            }
            try {
                const offlineBets = await storage.getFiltered(storageFilters);
                setTimeout(() => {
                    dispatch(Msg.getBetsRequested({ filters, resolve: () => { } }));
                }, 0);
                return Result.ok(offlineBets as BetType[]);
            } catch (error) {
                log.warn('getBetsOfflineFirst failed', { error });
                return Result.error(error as Error);
            }
        },

        syncPending: async () => {
            return new Promise<{ success: number; failed: number; successBets: string[]; failedBets: { receiptCode: string; error: string }[]; structureTotalCollected?: number; structureId?: number }>((resolve, reject) => {
                dispatch(Msg.syncRequested({
                    resolve: (result) => result.isOk() ? resolve(result.value) : reject(result.error)
                }));
            });
        },

        addPendingBet: async (bet: BetDomainModel) => {
            return new Promise<void>((resolve, reject) => {
                dispatch(Msg.addPendingBetRequested({
                    bet,
                    resolve: (result) => result.isOk() ? resolve() : reject(result.error)
                }));
            });
        },

        cleanup: async (today: string) => {
            return new Promise<number>((resolve, reject) => {
                dispatch(Msg.cleanupRequested({
                    today,
                    resolve: (result) => result.isOk() ? resolve(result.value) : reject(result.error)
                }));
            });
        },

        recoverStuckBets: async () => {
            return new Promise<number>((resolve, reject) => {
                dispatch(Msg.recoverStuckRequested({
                    resolve: (result) => result.isOk() ? resolve(result.value) : reject(result.error)
                }));
            });
        },

        resetSyncStatus: async (offlineId: string) => {
            return new Promise<void>((resolve, reject) => {
                dispatch(Msg.resetSyncStatusRequested({
                    offlineId,
                    resolve: (result) => result.isOk() ? resolve() : reject(result.error)
                }));
            });
        },

        applyMaintenance: async () => {
            dispatch(Msg.maintenanceCompleted());
            await Promise.all([
                new Promise<number>((resolve, reject) => dispatch(Msg.cleanupFailedRequested({ days: BET_VALUES.CLEANUP_DAYS_DEFAULT, resolve: (result) => result.isOk() ? resolve(result.value) : reject(result.error) }))),
                new Promise<number>((resolve, reject) => dispatch(Msg.recoverStuckRequested({ resolve: (result) => result.isOk() ? resolve(result.value) : reject(result.error) })))
            ]);
        },

        getFinancialSummary: async (todayStart: number, structureId?: string, defaultCommissionRate?: number) => {
            log.info(BET_LOGS.FINANCIAL_SUMMARY_CALLED, { todayStart, structureId, defaultCommissionRate });
            const timeoutMs = BET_VALUES.FINANCIAL_SUMMARY_TIMEOUT_MS;
            const mainPromise = new Promise<RawBetTotals>((resolve, reject) => {
                dispatch(Msg.financialSummaryRequested({
                    todayStart,
                    structureId,
                    defaultRate: defaultCommissionRate,
                    resolve: (result) => {
                        log.info(BET_LOGS.FINANCIAL_SUMMARY_RESOLVED, { isOk: result.isOk(), value: result.isOk() ? result.value : null });
                        result.isOk() ? resolve(result.value) : reject(result.error)
                    }
                }));
            });
            const timeoutPromise = new Promise<RawBetTotals>((_, reject) =>
                setTimeout(() => {
                    log.warn(`${BET_LOGS.FINANCIAL_SUMMARY_TIMEOUT} after ${timeoutMs}ms`);
                    reject(new Error('TIMEOUT_FINANCIAL_SUMMARY'));
                }, timeoutMs)
            );
            return Promise.race([mainPromise, timeoutPromise]);
        },

        getTotalsByDrawId: async (todayStart: number, structureId?: string, defaultCommissionRate?: number) => {
            return new Promise<Record<string, RawBetTotals>>((resolve, reject) => {
                dispatch(Msg.totalsByDrawRequested({
                    todayStart,
                    structureId,
                    defaultRate: defaultCommissionRate,
                    resolve: (result) => result.isOk() ? resolve(result.value) : reject(result.error)
                }));
            });
        },

        hasCriticalPendingBets: async (beforeTimestamp: number) => {
            const allBets = await storage.getAll();
            return allBets.some(bet =>
                (bet.status === 'pending' || bet.status === 'error' || bet.status === 'blocked') &&
                bet.timestamp < beforeTimestamp
            );
        },

        getAllRawBets: async () => storage.getAll(),

        getPendingBets: async () => storage.getPending(),

        isAppBlocked: async () => {
            const blockedBets = await storage.getByStatus('blocked');
            return { blocked: blockedBets.length > 0, blockedBetsCount: blockedBets.length };
        },

        getChildren: async (id: number, level: number = 1) => api.getChildren(id, level),

        getListeroDetails: async (id: number, date?: string) => api.getListeroDetails(id, date),

        delete: async (betId: number) => api.delete(betId),

        isReady: async () => true,
    };
};

// Export singleton
export const betRepository = createBetRepository(
    new BetOfflineAdapter(),
    new BetApiAdapter()
);

