import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { Return, singleton, ret } from '@/shared/core/return';
import { logger } from '@/shared/utils/logger';

import { updateAuthTokenCmd } from './commands';

// Handlers
import { DataHandler } from './handlers/data.handler';
import { NavigationHandler } from './handlers/navigation.handler';
import { FilterHandler } from './handlers/filter.handler';
import { AuthHandler } from './handlers/auth.handler';

const log = logger.withTag('DASHBOARD_UPDATE');

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    // log.debug('Update msg', { type: msg.type });

    const result = match<Msg, Return<Model, Msg>>(msg)
        // Data Handling
        .with({ type: 'FETCH_DATA_REQUESTED' }, ({ structureId }) =>
            DataHandler.handleFetchDataRequested(model, structureId)
        )
        .with({ type: 'DRAWS_RECEIVED' }, ({ webData }) => {
            log.info('DRAWS_RECEIVED', { type: webData.type });
            return DataHandler.handleDrawsReceived(model, webData);
        })
        .with({ type: 'SUMMARY_RECEIVED' }, ({ webData }) =>
            DataHandler.handleSummaryReceived(model, webData)
        )
        .with({ type: 'PENDING_BETS_LOADED' }, ({ bets }) =>
            DataHandler.handlePendingBetsLoaded(model, bets)
        )
        .with({ type: 'REFRESH_CLICKED' }, () =>
            DataHandler.handleRefreshClicked(model)
        )
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
            const result = AuthHandler.handleAuthUserSynced(model, user);
            const nextModel = result.model;
            const nextCmd = result.cmd;

            log.info('Auth Sync Result', {
                drawsState: nextModel.draws.type,
                userStructureId: nextModel.userStructureId,
                hasCmd: !!nextCmd
            });

            // Add token update if structure changed
            if (model.userStructureId !== nextModel.userStructureId) {
                log.info('Structure changed, forcing token update');
                return ret(
                    nextModel,
                    Cmd.batch([
                        nextCmd || Cmd.none,
                        updateAuthTokenCmd()
                    ])
                );
            }
            return result;
        })
        .with({ type: 'AUTH_TOKEN_UPDATED' }, ({ token }) => {
            // log.debug('AUTH_TOKEN_UPDATED');
            return AuthHandler.handleAuthTokenUpdated(model, token);
        })
        .with({ type: 'SET_USER_STRUCTURE' }, ({ id }) =>
            AuthHandler.handleSetUserStructure(model, id)
        )
        .with({ type: 'TOGGLE_BALANCE' }, () =>
            AuthHandler.handleToggleBalance(model)
        )

        // Filter Handling
        .with({ type: 'STATUS_FILTER_CHANGED' }, ({ filter }) =>
            FilterHandler.handleStatusFilterChanged(model, filter)
        )
        .with({ type: 'APPLY_STATUS_FILTER' }, ({ filter }) =>
            FilterHandler.handleApplyStatusFilter(model, filter)
        )
        .with({ type: 'SET_COMMISSION_RATE' }, ({ rate }) =>
            FilterHandler.handleSetCommissionRate(model, rate)
        )

        // Navigation Handling
        .with({ type: 'RULES_CLICKED' }, ({ drawId }) =>
            NavigationHandler.handleRulesClicked(model, drawId)
        )
        .with({ type: 'REWARDS_CLICKED' }, ({ drawId, title }) =>
            NavigationHandler.handleRewardsClicked(model, drawId, title)
        )
        .with({ type: 'BETS_LIST_CLICKED' }, ({ drawId, title }) =>
            NavigationHandler.handleBetsListClicked(model, drawId, title)
        )
        .with({ type: 'CLOSE_DRAW_CLICKED' }, ({ drawId, title }) =>
            NavigationHandler.handleCloseDrawClicked(model, drawId, title)
        )
        .with({ type: 'VALIDATE_DRAW_CLICKED' }, ({ drawId, title }) =>
            NavigationHandler.handleValidateDrawClicked(model, drawId, title)
        )
        .exhaustive();

    return [result.model, result.cmd || Cmd.none];
};
