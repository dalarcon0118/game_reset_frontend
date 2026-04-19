import { Model } from '../model';
import { Msg, FinancialUpdate } from '../msg';
import { Cmd, RemoteData, WebData, ret, singleton, Return } from '@core/tea-utils';
import { shouldFetchData, checkRateLimit, recalculateDashboardState, handleSseUpdate } from '../logic';
import { fetchDrawsCmd, loadPendingBetsCmd } from '../commands';
import { match, P } from 'ts-pattern';
import { DrawType, BetType } from '@/types';
import { logger } from '@/shared/utils/logger';
import { GameRegistry } from '@/shared/core/registry/game_registry';
import { TimerRepository } from '@/shared/repositories/system/time/tea.repository';

import { dashboardService } from '../../services/dashboard.service';

const log = logger.withTag('DASHBOARD_DATA_HANDLER');

const checkReadyState = (model: Model): Return<Model, Msg> => {
    log.debug('checkReadyState called', {
        drawsType: model.draws.type,
        currentStatus: model.status.type
    });

    // El Dashboard está listo si los sorteos ya terminaron de cargar (éxito o error)
    const isDataLoaded = model.draws.type === 'Success' || model.draws.type === 'Failure';

    if (isDataLoaded) {
        log.info('Transitioning dashboard to READY state', { type: model.draws.type });
        return singleton({ ...model, status: { type: 'READY' } });
    }

    log.debug('checkReadyState: draws still loading', { drawsType: model.draws.type });
    return singleton(model);
};

export const DataHandler = {
    handleFetchDataRequested: (model: Model, structureId?: string): Return<Model, Msg> => {
        const id = structureId || model.userStructureId;

        if (!shouldFetchData(model, id)) {
            // Even if we don't fetch remote data, we should check local pending bets
            return ret(model, loadPendingBetsCmd());
        }

        const validId = id!;
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
        const now = TimerRepository.getTrustedNow(Date.now());

        const { filteredDraws, dailyTotals } = recalculateDashboardState(
            drawsData,
            null, // No external summary needed
            model.appliedFilter,
            model.commissionRate,
            now,
            safeBets,
            allSynced
        );

        // CAMBIO CRÍTICO: El dashboard puede estar READY si las apuestas ya cargaron, 
        // permitiendo mostrar el resumen financiero local de inmediato.
        return checkReadyState({
            ...model,
            pendingBets: safeBets,
            syncedBets: allSynced,
            filteredDraws,
            dailyTotals
        });
    },

    handleDrawsReceived: (model: Model, webData: WebData<DrawType[]>): Return<Model, Msg> => {
        log.info('[CRITERION_3] DRAWS_RECEIVED: Respuesta del servidor recibida', {
            responseType: webData.type,
            drawCount: webData.type === 'Success' ? webData.data.length : 0,
            previousDrawsState: model.draws.type,
            userStructureId: model.userStructureId
        });

        if (webData.type === 'Success' && !Array.isArray(webData.data)) {
            log.error('[CRITERION_3_FAIL] DRAWS_INVALID_PAYLOAD: El servidor devolvio datos invalidos', {
                actualType: typeof webData.data,
                isArray: Array.isArray(webData.data)
            });
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
                    log.warn('[CRITERION_3A] RATE_LIMITED: Servidor limito solicitudes, manteniendo datos anteriores', {
                        hadPreviousData: model.draws.type === 'Success',
                        previousDrawCount: model.draws.type === 'Success' ? model.draws.data.length : 0
                    });
                    return singleton({ ...model, isRateLimited: true });
                }
            )
            // 2. Success Case: Update draws and recalculate derived state
            .with({ type: 'Success', data: P.select() }, (data: DrawType[]) => {
                log.info('[CRITERION_3B] DRAWS_SUCCESS: Datos de sorteos recibidos correctamente', {
                    drawCount: data.length,
                    firstDrawId: data[0]?.id,
                    hasPremiumsData: data.some(d => ((d as any).premiums_paid ?? d.premiumsPaid ?? 0) > 0),
                    premiumsInDraws: data.map(d => ({ id: d.id, premiumsPaid: (d as any).premiums_paid ?? d.premiumsPaid ?? 0, status: d.status }))
                });

                // Sincronizar el registro de juegos con los datos recibidos del backend
                GameRegistry.syncWithBackend(data);

                const now = TimerRepository.getTrustedNow(Date.now());

                const { filteredDraws, dailyTotals } = recalculateDashboardState(
                    data,
                    null, // No external summary needed
                    model.appliedFilter,
                    model.commissionRate,
                    now,
                    model.pendingBets,
                    model.syncedBets
                );

                log.info('[CRITERION_4] DAILY_TOTALS_CALCULATED: Totales diarios recalculados', {
                    totalCollected: dailyTotals.totalCollected,
                    premiumsPaid: dailyTotals.premiumsPaid,
                    netResult: dailyTotals.netResult,
                    filteredDrawsCount: filteredDraws.length,
                    premiumsFromDraws: data.map(d => ({ id: d.id, premiumsPaid: (d as any).premiums_paid || d.premiumsPaid || 0 }))
                });

                log.debug('Recalculated dashboard state', {
                    totalDraws: data.length,
                    filteredCount: filteredDraws.length,
                    filter: model.appliedFilter,
                    totals: dailyTotals
                });

                return checkReadyState({
                    ...model,
                    draws: webData,
                    isRateLimited: false,
                    filteredDraws,
                    dailyTotals
                });
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
        log.info('[CRITERION_1] REFRESH_INITIATED: Usuario solicito sincronizacion manual', {
            userStructureId: model.userStructureId,
            currentDrawsState: model.draws.type,
            hasPendingBets: model.pendingBets.length > 0,
            isRateLimited: model.isRateLimited
        });
        
        // DIAGNOSTIC: Log antes de invalidar cache
        log.info('[REFRESH_DIAGNOSTIC] Antes de invalidar dashboard cache');
        dashboardService.invalidateDashboard();
        log.info('[REFRESH_DIAGNOSTIC] Despues de invalidar dashboard cache');

        log.info('[CRITERION_2] REFRESH_COMMAND_DISPATCHED: Comandos HTTP encolados', {
            hasFetchDrawsCmd: true,
            hasLoadPendingBetsCmd: true,
            structureId: model.userStructureId
        });

        // DIAGNOSTIC: Verificar que el structureId no sea null o invalido
        if (!model.userStructureId) {
            log.error('[REFRESH_DIAGNOSTIC] CRITICAL: userStructureId es null o invalido!');
        }

        const result = ret(model, [
            fetchDrawsCmd(model.userStructureId, true),
            loadPendingBetsCmd()
        ] as Cmd);
        
        log.info('[REFRESH_DIAGNOSTIC] Resultado del refresh:', {
            hasCommands: (result.cmd as any[] || []).length > 0
        });
        
        return result;
    },

    handleTick: (model: Model): Return<Model, Msg> => {
        const isCurrentlyLoading = model.draws.type === 'Loading';

        if (model.userStructureId && !model.isRateLimited && !isCurrentlyLoading) {
            log.debug('Tick triggered fetch');
            return ret(model, [
                fetchDrawsCmd(model.userStructureId),
                loadPendingBetsCmd()
            ] as Cmd);
        }

        if (isCurrentlyLoading) {
            log.debug('Tick skipped: fetch already in progress');
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
