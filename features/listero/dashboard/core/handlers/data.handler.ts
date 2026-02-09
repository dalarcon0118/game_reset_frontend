import { Model } from '../model';
import { Msg, FinancialUpdate } from '../msg';
import { Cmd } from '@/shared/core/cmd';
import { RemoteData, WebData } from '@/shared/core/remote.data';
import { ret, singleton, Return } from '@/shared/core/return';
import { shouldFetchData, checkRateLimit, recalculateDashboardState, handleSseUpdate } from '../logic';
import { fetchDrawsCmd, fetchSummaryCmd, loadPendingBetsCmd } from '../commands';
import { match, P } from 'ts-pattern';
import { DrawType, FinancialSummary } from '@/types';
import { PendingBet } from '@/shared/services/offline_storage';

export const DataHandler = {
    handleFetchDataRequested: (model: Model, structureId?: string): Return<Model, Msg> => {
        const id = structureId || model.userStructureId;

        if (!shouldFetchData(model, id)) {
            // Even if we don't fetch remote data, we should check local pending bets
            return ret(model, loadPendingBetsCmd());
        }

        const validId = id!;
        console.log('update: FETCH_DATA_REQUESTED starting load for', validId);

        return ret(
            {
                ...model,
                userStructureId: validId,
                draws: RemoteData.loading(),
                summary: RemoteData.loading()
            },
            [fetchDrawsCmd(validId), fetchSummaryCmd(validId), loadPendingBetsCmd()] as Cmd
        );
    },

    handlePendingBetsLoaded: (model: Model, bets: PendingBet[]): Return<Model, Msg> => {
        console.log('update: PENDING_BETS_LOADED', bets.length);

        const summary = model.summary.type === 'Success' ? model.summary.data : null;
        const drawsData = model.draws.type === 'Success' ? model.draws.data : null;

        const { filteredDraws, dailyTotals } = recalculateDashboardState(
            drawsData,
            summary,
            model.appliedFilter,
            model.commissionRate,
            bets
        );

        return singleton({
            ...model,
            pendingBets: bets,
            filteredDraws,
            dailyTotals
        });
    },

    handleDrawsReceived: (model: Model, webData: WebData<DrawType[]>): Return<Model, Msg> => {
        console.log('update: DRAWS_RECEIVED state', webData.type);

        return match(webData)
            // 1. Rate Limit Case: Failure + we already had successful data
            .when(
                (data) => checkRateLimit(data) && model.draws.type === 'Success',
                () => {
                    console.log('update: Rate limited, keeping previous draws data');
                    return singleton({ ...model, isRateLimited: true });
                }
            )
            // 2. Success Case: Update draws and recalculate derived state
            .with({ type: 'Success', data: P.select() }, (data) => {
                const summary = model.summary.type === 'Success' ? model.summary.data : null;
                const { filteredDraws, dailyTotals } = recalculateDashboardState(
                    data,
                    summary,
                    model.appliedFilter,
                    model.commissionRate,
                    model.pendingBets
                );

                return singleton({
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

    handleSummaryReceived: (model: Model, webData: WebData<FinancialSummary>): Return<Model, Msg> => {
        console.log('update: SUMMARY_RECEIVED state', webData.type);

        return match(webData)
            // 1. Rate Limit Case: Failure + we already had successful data
            .when(
                (data) => checkRateLimit(data) && model.summary.type === 'Success',
                () => {
                    console.log('update: Rate limited, keeping previous summary data');
                    return singleton({ ...model, isRateLimited: true });
                }
            )
            // 2. Success Case: Recalculate derived state
            .with({ type: 'Success', data: P.select() }, (data) => {
                console.log('update: Updating dailyTotals from real-time summary', data);

                const drawsData = model.draws.type === 'Success' ? model.draws.data : null;
                const { filteredDraws, dailyTotals } = recalculateDashboardState(
                    drawsData,
                    data,
                    model.appliedFilter,
                    model.commissionRate,
                    model.pendingBets
                );

                return singleton({
                    ...model,
                    summary: webData,
                    isRateLimited: false,
                    filteredDraws,
                    dailyTotals
                });
            })
            // 3. Other cases (Loading, NotAsked, Failure without previous data): Just update summary
            .otherwise(() =>
                singleton({ ...model, summary: webData, isRateLimited: false })
            );
    },

    handleRefreshClicked: (model: Model): Return<Model, Msg> => {
        return ret(model, [
            fetchDrawsCmd(model.userStructureId),
            fetchSummaryCmd(model.userStructureId),
            loadPendingBetsCmd()
        ] as Cmd);
    },

    handleTick: (model: Model): Return<Model, Msg> => {
        if (model.userStructureId && !model.isRateLimited) {
            console.log('update: TICK triggered fetch');
            return ret(model, [
                fetchDrawsCmd(model.userStructureId),
                fetchSummaryCmd(model.userStructureId),
                loadPendingBetsCmd()
            ] as Cmd);
        }
        return singleton(model);
    },

    handleFinancialUpdateReceived: (model: Model, update: FinancialUpdate): Return<Model, Msg> => {
        console.log('update: FINANCIAL_UPDATE_RECEIVED', update);

        const { shouldFetch } = handleSseUpdate(model, update);

        if (shouldFetch) {
            // CRITICAL FIX: Fetch BOTH summary and pending bets to avoid "Double Counting".
            // If we only fetch summary, the new summary (including the bet) would be added 
            // to the stale pendingBets (still containing the bet), causing a temporary spike.
            return ret(
                { ...model, summary: RemoteData.loading() },
                [fetchSummaryCmd(model.userStructureId), loadPendingBetsCmd()] as Cmd
            );
        }

        return singleton(model);
    },

    handleSseConnected: (model: Model): Return<Model, Msg> => {
        console.log('update: SSE_CONNECTED');
        return singleton(model);
    },

    handleSseError: (model: Model, error: string): Return<Model, Msg> => {
        console.error('update: SSE_ERROR', error);
        return singleton(model);
    }
};
