import { Model } from '../model';
import { Msg, FinancialUpdate } from '../msg';
import { Cmd, RemoteData, WebData, ret, singleton, Return } from '@core/tea-utils';
import { shouldFetchData, checkRateLimit, recalculateDashboardState } from '../logic';
import { fetchDrawsCmd, loadPendingBetsCmd } from '../commands';
import { match, P } from 'ts-pattern';
import { DrawType, BetType } from '@/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_DATA_HANDLER');

const checkReadyState = (model: Model): Model => {
    if (model.draws.type === 'Success') {
        return { ...model, status: { type: 'READY' } };
    }
    return model;
};

export const DataHandler = {
    handleFetchDataRequested: (model: Model, structureId?: string): Return<Model, Msg> => {
        console.log('[DEBUG] handleFetchDataRequested: INICIANDO con structureId =', structureId);
        const id = structureId || model.userStructureId;

        if (!shouldFetchData(model, id)) {
            console.log('[DEBUG] handleFetchDataRequested: SALTADO - shouldFetchData retornó false');
            // Even if we don't fetch remote data, we should check local pending bets
            return ret(model, loadPendingBetsCmd());
        }

        const validId = id!;
        console.log('[DEBUG] handleFetchDataRequested: PROCEDIENDO con validId =', validId);
        log.debug('Starting load', { structureId: validId });

        return ret(
            {
                ...model,
                userStructureId: validId,
                draws: RemoteData.loading()
            },
            [fetchDrawsCmd(validId), loadPendingBetsCmd()] as Cmd
        );
    },

    handlePendingBetsLoaded: (model: Model, bets: BetType[], syncedBets?: BetType[]): Return<Model, Msg> => {
        const safeBets = Array.isArray(bets) ? bets : [];
        const allSynced = Array.isArray(syncedBets) ? syncedBets : (Array.isArray(model.syncedBets) ? model.syncedBets : []);

        log.debug('Bets loaded', { pending: safeBets.length, synced: allSynced.length });

        const drawsData = model.draws.type === 'Success' ? model.draws.data : null;

        const { filteredDraws, dailyTotals } = recalculateDashboardState(
            drawsData,
            null, // No external summary needed
            model.appliedFilter,
            model.commissionRate,
            safeBets,
            allSynced
        );

        return singleton({
            ...model,
            pendingBets: safeBets,
            syncedBets: allSynced,
            filteredDraws,
            dailyTotals
        });
    },

    handleDrawsReceived: (model: Model, webData: WebData<DrawType[]>): Return<Model, Msg> => {
        console.log('[DEBUG] handleDrawsReceived: RECIBIDO', { type: webData.type, count: webData.type === 'Success' ? webData.data.length : 0 });
        log.debug('Draws received', {
            state: webData.type,
            count: webData.type === 'Success' ? webData.data.length : 0,
            firstDraw: webData.type === 'Success' && webData.data.length > 0 ? webData.data[0] : null
        });

        if (webData.type === 'Success' && !Array.isArray(webData.data)) {
            return singleton({
                ...model,
                draws: RemoteData.failure(new Error('Invalid draws payload')),
                isRateLimited: false,
                filteredDraws: []
            });
        }

        return match(webData)
            // 1. Rate Limit Case: Failure + we already had successful data
            .when(
                (data) => checkRateLimit(data) && model.draws.type === 'Success',
                () => {
                    log.warn('Rate limited, keeping previous draws data');
                    return singleton({ ...model, isRateLimited: true });
                }
            )
            // 2. Success Case: Update draws and recalculate derived state
            .with({ type: 'Success', data: P.select() }, (data) => {
                const { filteredDraws, dailyTotals } = recalculateDashboardState(
                    data,
                    null, // No external summary needed
                    model.appliedFilter,
                    model.commissionRate,
                    model.pendingBets,
                    model.syncedBets
                );

                log.debug('Recalculated dashboard state', {
                    totalDraws: data.length,
                    filteredCount: filteredDraws.length,
                    filter: model.appliedFilter,
                    totals: dailyTotals
                });

                return singleton(checkReadyState({
                    ...model,
                    draws: webData,
                    isRateLimited: false,
                    filteredDraws,
                    dailyTotals
                }));
            })
            // 3. Other cases: Update draws, clear filteredDraws
            .otherwise(() =>
                singleton({
                    ...model,
                    draws: webData,
                    isRateLimited: false,
                    filteredDraws: []
                })
            );
    },

    handleRefreshClicked: (model: Model): Return<Model, Msg> => {
        console.log('[DEBUG] handleRefreshClicked: INICIANDO');
        return ret(model, [
            fetchDrawsCmd(model.userStructureId),
            loadPendingBetsCmd()
        ] as Cmd);
    },

    handleTick: (model: Model): Return<Model, Msg> => {
        if (model.userStructureId && !model.isRateLimited) {
            log.debug('Tick triggered fetch');
            return ret(model, [
                fetchDrawsCmd(model.userStructureId),
                loadPendingBetsCmd()
            ] as Cmd);
        }
        return singleton(model);
    },

    handleDailySessionPrepared: (model: Model, success: boolean): Return<Model, Msg> => {
        log.info('Daily session preparation completed', { success });
        
        // Si el mantenimiento fue exitoso, forzamos la carga de datos frescos
        if (success && model.userStructureId) {
            log.info('Triggering fresh data fetch after maintenance');
            return DataHandler.handleFetchDataRequested(model, model.userStructureId);
        }
        
        return singleton(model);
    },

    handleFinancialUpdateReceived: (model: Model, update: FinancialUpdate): Return<Model, Msg> => {
        log.debug('Financial update received', { update });

        const { shouldFetch } = handleSseUpdate(model, update);

        if (shouldFetch) {
            // CRITICAL FIX: Fetch pending bets to avoid "Double Counting".
            return ret(
                model,
                loadPendingBetsCmd()
            );
        }

        return singleton(model);
    },

    handleSseConnected: (model: Model): Return<Model, Msg> => {
        log.info('SSE Connected');
        return singleton(model);
    },

    handleSseError: (model: Model, error: string): Return<Model, Msg> => {
        log.error('SSE Error', error);
        return singleton(model);
    }
};
