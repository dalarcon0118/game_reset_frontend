import { match, P } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd, Return, ret } from '@core/tea-utils';
import { logger } from '@/shared/utils/logger';

import { updateAuthTokenCmd } from './commands';
import { ensureError } from '@/shared/utils/error';

import { DataHandler } from './handlers/data.handler';
import { NavigationHandler } from './handlers/navigation.handler';
import { FilterHandler } from './handlers/filter.handler';
import { AuthHandler, triggerInitialLoad } from './handlers/auth.handler';
import * as PromotionUpdate from '../../../../shared/components/promotion/update';
import { PROMOTION_MSG, RETRY_INITIAL_LOAD } from './msg';

import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { drawRepository } from '@/shared/repositories/draw';
import { dashboardService } from '../services/dashboard.service';
import { filterDraws } from './logic/index';
import { DrawTotalsUpdate } from './msg';

import { syncWorker } from '@core/offline-storage/instance';
import { notificationRepository } from '@/shared/repositories/notification';
import { Alert } from 'react-native';

const log = logger.withTag('DASHBOARD_UPDATE');

export const update = (model: Model, msg: Msg): Return<Model, Msg> => {
    // log.debug('Update msg', { type: msg.type });

    return match<Msg, Return<Model, Msg>>(msg)
        // Feature: Promotions
        .with({ type: 'PROMOTION_MSG', msg: P.select() }, (subMsg) => {
            const promotionReturn = PromotionUpdate.update(subMsg, model.promotion);
            return Return.val<Model, Msg>(
                { ...model, promotion: promotionReturn.model },
                Cmd.map(PROMOTION_MSG, promotionReturn.cmd)
            );
        })

        // Data Handling
        .with({ type: 'FETCH_DATA_REQUESTED' }, ({ structureId }) =>
            DataHandler.handleFetchDataRequested(model, structureId)
        )
        .with({ type: 'DRAWS_RECEIVED', webData: P.select() }, (webData) =>
            DataHandler.handleDrawsReceived(model, webData)
        )
        .with({ type: 'PENDING_BETS_LOADED' }, ({ bets, syncedBets }) =>
            DataHandler.handlePendingBetsLoaded(model, bets, syncedBets)
        )
        .with({ type: 'REFRESH_CLICKED' }, () =>
            DataHandler.handleRefreshClicked(model)
        )
        .with({ type: 'RETRY_INITIAL_LOAD' }, () => {
            log.warn('[DASHBOARD] RETRY_INITIAL_LOAD triggered - retrying initial data load');
            return triggerInitialLoad(model);
        })
        .with({ type: 'TICK' }, () =>
            DataHandler.handleTick(model)
        )
        .with({ type: 'FINANCIAL_UPDATE_RECEIVED' }, ({ update }) =>
            DataHandler.handleFinancialUpdateReceived(model, update)
        )
        .with({ type: 'SSE_CONNECTED' }, () =>
            DataHandler.handleSseConnected(model)
        )
        .with({ type: 'SSE_ERROR' }, ({ error }) =>
            DataHandler.handleSseError(model, error)
        )

        // Auth Handling
        .with({ type: 'AUTH_USER_SYNCED' }, ({ user }) => {
            if (!user) {
                log.info('AUTH_USER_SYNCED: Logout');
                return AuthHandler.handleAuthUserSynced(model, null);
            }

            log.info('AUTH_USER_SYNCED', { id: user.id, structureId: user.structureId });
            return AuthHandler.handleAuthUserSynced(model, user);
        })
        .with({ type: 'AUTH_TOKEN_UPDATED' }, ({ token }) => {
            // log.debug('AUTH_TOKEN_UPDATED');
            return AuthHandler.handleAuthTokenUpdated(model, token);
        })
        .with({ type: 'NEEDS_PASSWORD_CHANGE' }, ({ needsChange }) => {
            return ret(
                { ...model, needsPasswordChange: needsChange },
                Cmd.none
            );
        })
        .with({ type: 'SET_USER_STRUCTURE' }, ({ id }) =>
            AuthHandler.handleSetUserStructure(model, id)
        )
        .with({ type: 'TOGGLE_BALANCE' }, () =>
            AuthHandler.handleToggleBalance(model)
        )
        .with({ type: 'SYSTEM_READY' }, ({ date, structureId, user }) =>
            AuthHandler.handleSystemReady(model, date, structureId, user)
        )

        // Error Handling
        .with({ type: 'ERROR' }, ({ error }) => {
            log.error('Dashboard error received', error);
            // Si hay un error durante la carga, permitimos que el Dashboard pase a READY
            // para que el usuario pueda al menos ver los datos locales o reintentar.
            if (model.status.type === 'LOADING_DATA') {
                return DataHandler.handleDrawsReceived(model, { type: 'Failure', error: ensureError(error) });
            }
            return ret(model, Cmd.none);
        })

        // Filter Handling
        .with({ type: 'STATUS_FILTER_CHANGED' }, ({ filter }) =>
            FilterHandler.handleStatusFilterChanged(model, filter)
        )
        .with({ type: 'APPLY_STATUS_FILTER' }, ({ filter }) =>
            FilterHandler.handleApplyStatusFilter(model, filter)
        )

        // Navigation Handling
        .with({ type: 'RULES_CLICKED' }, ({ drawId }) =>
            NavigationHandler.handleRulesClicked(model, drawId)
        )
        .with({ type: 'REWARDS_CLICKED' }, ({ drawId, title }) =>
            NavigationHandler.handleRewardsClicked(model, drawId, title)
        )
        .with({ type: 'BETS_LIST_CLICKED' }, ({ drawId, title, drawType }) =>
            NavigationHandler.handleBetsListClicked(model, drawId, title, drawType)
        )
        .with({ type: 'CREATE_BET_CLICKED' }, ({ drawId, title, drawType }) =>
            NavigationHandler.handleCreateBetClicked(model, drawId, title, drawType)
        )
        .with({ type: 'HELP_CLICKED' }, () =>
            NavigationHandler.handleHelpClicked(model)
        )
        .with({ type: 'NOTIFICATIONS_CLICKED' }, () =>
            NavigationHandler.handleNotificationsClicked(model)
        )
        .with({ type: 'SETTINGS_CLICKED' }, () =>
            NavigationHandler.handleSettingsClicked(model)
        )
        .with({ type: 'NAVIGATE_TO_ERROR' }, () =>
            NavigationHandler.handleNavigateToError(model)
        )
        // SSOT: Toggle balance visibility (from summary_plugin)
        .with({ type: 'TOGGLE_BALANCE_VISIBILITY' }, () =>
            ret({ ...model, showBalance: !model.showBalance }, Cmd.none)
        )
        // SSOT: Financial bets (from summary_plugin)
        .with({ type: 'GET_FINANCIAL_BETS' }, () =>
            handleGetFinancialBets(model)
        )
        .with({ type: 'FINANCIAL_BETS_UPDATED' }, ({ webData }) =>
            handleFinancialBetsUpdated(model, webData)
        )
        // SSOT: Local draws (from draws_list_plugin)
        .with({ type: 'REQUEST_LOCAL_DRAWS' }, () =>
            handleRequestLocalDraws(model)
        )
  .with({ type: 'LOCAL_DRAWS_LOADED' }, ({ draws, filteredDraws }) => {
    return ret(
      { ...model, draws: { type: 'Success', data: draws }, filteredDraws },
      Cmd.none
    );
  })
        // SSOT: Totals by drawId (from draws_list_plugin)
        .with({ type: 'BATCH_OFFLINE_UPDATE' }, ({ updates, timestamp }) =>
            handleBatchOfflineUpdate(model, updates, timestamp)
        )
        // SSOT: External bet storage changed (from offlineEventBus via Sub.custom)
        .with({ type: 'EXTERNAL_BETS_CHANGED' }, () =>
            DataHandler.handleExternalBetsChanged(model)
        )
        .with({ type: 'SELECT_FILTER' }, ({ filter }) =>
            FilterHandler.handleApplyStatusFilter(model, filter)
        )
        // SSOT: Manual sync reconciliation
        .with({ type: 'SYNC_PRESSED' }, () =>
            handleSyncPressed(model)
        )
        .with({ type: 'SYNC_COMPLETED' }, ({ successCount, failedCount }) =>
            handleSyncCompleted(model, successCount, failedCount)
        )
        .with({ type: 'SYNC_ERROR' }, ({ error }) =>
            handleSyncError(model, error)
        )
        .with({ type: 'NONE' }, () => ret(model, Cmd.none))
        .exhaustive();
};

// SSOT: Financial Bets Handlers (from summary_plugin)
function handleGetFinancialBets(model: Model): Return<Model, Msg> {
  if (!model.userStructureId) return ret(model, Cmd.none);

  const trustedNow = Date.now();
  const trustedDate = new Date(trustedNow);
  const todayStart = new Date(
    trustedDate.getFullYear(),
    trustedDate.getMonth(),
    trustedDate.getDate()
  ).getTime();

  return ret(
    { ...model, financialSummary: { type: 'Loading' } as any, trustedNow },
    Cmd.task({
      task: async () => {
        if (!model.userStructureId) return { type: 'Failure' as const, error: new Error('No structure ID') };
        const rawData = await betRepository.getFinancialSummary(todayStart, model.userStructureId);
        return { type: 'Success' as const, data: rawData };
      },
      onSuccess: (result) => ({ type: 'FINANCIAL_BETS_UPDATED', webData: result }),
      onFailure: (error) => ({ type: 'FINANCIAL_BETS_UPDATED', webData: { type: 'Failure', error } })
    })
  );
}

function handleFinancialBetsUpdated(model: Model, webData: any): Return<Model, Msg> {
  return ret({ ...model, financialSummary: webData }, Cmd.none);
}

// SSOT: Local Draws Handler (from draws_list_plugin)
function handleRequestLocalDraws(model: Model): Return<Model, Msg> {
    if (!model.userStructureId) return ret(model, Cmd.none);

    return ret(
        { ...model, draws: { type: 'Loading' } as any },
        Cmd.task({
            task: async () => {
                const result = await drawRepository.getDraws({ owner_structure: model.userStructureId });
                if (result.isOk() && result.value.length > 0) {
                    const draws = result.value;
                    const trustedNow = Date.now();
                    const filteredDraws = filterDraws({
                        draws,
                        filter: model.appliedFilter,
                        currentTime: trustedNow
                    });
                    return { type: 'LOCAL_DRAWS_LOADED', draws, filteredDraws };
                }
                return { type: 'LOCAL_DRAWS_LOADED', draws: [], filteredDraws: [] };
            },
            onSuccess: (msg) => msg,
            onFailure: () => ({ type: 'LOCAL_DRAWS_LOADED', draws: [], filteredDraws: [] })
        })
    );
}

// SSOT: Batch Offline Update Handler (from draws_list_plugin)
function handleBatchOfflineUpdate(model: Model, updates: DrawTotalsUpdate[], timestamp: number): Return<Model, Msg> {
    const newTotalsByDrawId = new Map(model.totalsByDrawId);

    updates.forEach(update => {
        if (update.betCount === 0) {
            newTotalsByDrawId.delete(update.drawId);
        } else {
            newTotalsByDrawId.set(update.drawId, {
                drawId: update.drawId,
                totalCollected: update.totalCollected,
                premiumsPaid: update.premiumsPaid,
                netResult: update.netResult,
                betCount: update.betCount,
                lastUpdated: timestamp
            });
        }
    });

    return ret({ ...model, totalsByDrawId: newTotalsByDrawId }, Cmd.none);
}

// SSOT: Manual Sync Reconciliation Handlers
function handleSyncPressed(model: Model): Return<Model, Msg> {
    return ret(
        { ...model, syncStatus: 'syncing' as const },
        Cmd.task({
            task: async () => {
                try {
                    // Full reconcile: push all pending + pull fresh data
                    const [syncReport] = await Promise.all([
                        syncWorker.triggerSync(),
                        notificationRepository.forceSyncFromBackend().catch(() => [])
                    ]);
                    
                    return {
                        successCount: syncReport.succeeded,
                        failedCount: syncReport.failed,
                        status: syncReport.status
                    };
                } catch (error: any) {
                    throw new Error(error?.message || 'Sync failed');
                }
            },
            onSuccess: (result) => ({
                type: 'SYNC_COMPLETED',
                successCount: result.successCount,
                failedCount: result.failedCount
            }),
            onFailure: (error) => ({
                type: 'SYNC_ERROR',
                error: error?.message || 'Sync failed'
            })
        })
    );
}

function handleSyncCompleted(model: Model, successCount: number, failedCount: number): Return<Model, Msg> {
    const total = successCount + failedCount;
    const message = total === 0
        ? 'No había datos pendientes para sincronizar'
        : failedCount === 0
            ? `Sincronización completa: ${successCount} elemento(s) enviado(s)`
            : `Sincronización parcial: ${successCount} ok, ${failedCount} error(es)`;
    
    Alert.alert('Sincronización', message);
    
    return ret(
        { ...model, syncStatus: 'success' as const },
        Cmd.none
    );
}

function handleSyncError(model: Model, error: string): Return<Model, Msg> {
    Alert.alert('Error de sincronización', error);
    
    return ret(
        { ...model, syncStatus: 'error' as const },
        Cmd.none
    );
}
