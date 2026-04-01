import { match, P } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd, Return, ret } from '@core/tea-utils';
import { logger } from '@/shared/utils/logger';

import { updateAuthTokenCmd } from './commands';
import { ensureError } from '@/shared/utils/error';

// Handlers
import { DataHandler } from './handlers/data.handler';
import { NavigationHandler } from './handlers/navigation.handler';
import { FilterHandler } from './handlers/filter.handler';
import { AuthHandler } from './handlers/auth.handler';
import * as PromotionUpdate from '../../../../shared/components/promotion/update';
import { PROMOTION_MSG } from './msg';

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
        .with({ type: 'NONE' }, () => ret(model, Cmd.none))
        .exhaustive();
};
