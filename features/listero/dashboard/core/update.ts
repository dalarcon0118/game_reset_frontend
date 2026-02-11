import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';
import { Return, singleton } from '@/shared/core/return';

import { getAuthSub, getFinancialUpdatesSub, getDashboardPluginEventsSub } from './subscriptions';

// Handlers
import { DataHandler } from './handlers/data.handler';
import { NavigationHandler } from './handlers/navigation.handler';
import { FilterHandler } from './handlers/filter.handler';
import { AuthHandler } from './handlers/auth.handler';

export const subscriptions = (model: Model) => {
    const subs = [getAuthSub(), getDashboardPluginEventsSub()];

    if (model.authToken && model.userStructureId) {
        subs.push(getFinancialUpdatesSub(model.authToken));
    }

    return Sub.batch(subs);
};

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match<Msg, Return<Model, Msg>>(msg)
        // Data Handling
        .with({ type: 'FETCH_DATA_REQUESTED' }, ({ structureId }) =>
            DataHandler.handleFetchDataRequested(model, structureId)
        )
        .with({ type: 'DRAWS_RECEIVED' }, ({ webData }) =>
            DataHandler.handleDrawsReceived(model, webData)
        )
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
        .with({ type: 'AUTH_USER_SYNCED' }, ({ user }) =>
            AuthHandler.handleAuthUserSynced(model, user)
        )
        .with({ type: 'AUTH_TOKEN_UPDATED' }, ({ token }) =>
            AuthHandler.handleAuthTokenUpdated(model, token)
        )
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
        .with({ type: 'CREATE_BET_CLICKED' }, ({ drawId, title }) =>
            NavigationHandler.handleCreateBetClicked(model, drawId, title)
        )
        .with({ type: 'NAVIGATE_TO_ERROR' }, () =>
            NavigationHandler.handleNavigateToError(model)
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

        // Default
        .with({ type: 'NONE' }, () =>
            singleton(model)
        )
        .exhaustive();

    return [result.model, result.cmd];
};