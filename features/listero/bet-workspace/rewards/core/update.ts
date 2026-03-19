import { RewardsModel } from './model';
import {
    RewardsMsg,
    FETCH_ALL_DATA_REQUESTED,
} from './types';
import { Return, ret, singleton, Cmd, RemoteData } from '@core/tea-utils';
import { match } from 'ts-pattern';
import { IRewardsDataService, IRewardsUIService } from './adapters';

/**
 * 🎼 REWARDS UPDATE (Orchestrator)
 * Función pura que orquestra la lógica del módulo.
 * Delega los efectos secundarios a los servicios inyectados.
 */
export const makeUpdate = (
    dataService: IRewardsDataService,
    uiService: IRewardsUIService
) => (model: RewardsModel, msg: RewardsMsg): Return<RewardsModel, RewardsMsg> => {

    /**
     * 🛠️ INTERNAL HANDLERS
     * Delegan la construcción de comandos y estados.
     */
    const Handlers = {
        init: (drawId: string, title?: string): Return<RewardsModel, RewardsMsg> => {
            const nextModel = {
                ...model,
                currentDrawId: drawId,
                drawTitle: title || null
            };
            return ret(nextModel, Cmd.ofMsg(FETCH_ALL_DATA_REQUESTED({ drawId })));
        },

        fetchAllData: (drawId: string): Return<RewardsModel, RewardsMsg> => {
            const nextModel: RewardsModel = {
                ...model,
                rewards: { status: RemoteData.loading() as any },
                rules: { status: RemoteData.loading() as any },
                userWinnings: { status: RemoteData.loading() as any }
            };

            return ret(
                nextModel,
                Cmd.batch([
                    dataService.fetchDrawRewards(drawId),
                    dataService.fetchDrawRules(drawId),
                    dataService.fetchUserWinnings(drawId)
                ])
            );
        },

        handleRewardsSuccess: (data: any): Return<RewardsModel, RewardsMsg> =>
            singleton({ ...model, rewards: { status: data } }),

        handleRewardsFailure: (error: any): Return<RewardsModel, RewardsMsg> => {
            uiService.logEvent('fetch_rewards_failed', { error });
            return singleton({ ...model, rewards: { status: error } });
        },

        handleRulesSuccess: (data: any): Return<RewardsModel, RewardsMsg> =>
            singleton({ ...model, rules: { status: data } }),

        handleRulesFailure: (error: any): Return<RewardsModel, RewardsMsg> => {
            uiService.logEvent('fetch_rules_failed', { error });
            return singleton({ ...model, rules: { status: error } });
        },

        handleUserWinningsSuccess: (data: any): Return<RewardsModel, RewardsMsg> =>
            singleton({ ...model, userWinnings: { status: data } }),

        handleUserWinningsFailure: (error: any): Return<RewardsModel, RewardsMsg> => {
            uiService.logEvent('fetch_user_winnings_failed', { error });
            uiService.showError('No se pudieron cargar tus premios personales.');
            return singleton({ ...model, userWinnings: { status: error } });
        },

        goBack: (): Return<RewardsModel, RewardsMsg> => {
            uiService.goBack();
            return singleton(model);
        }
    };

    return match<RewardsMsg, Return<RewardsModel, RewardsMsg>>(msg)
        .with({ type: 'INIT_MODULE' }, ({ payload }) => Handlers.init(payload.drawId, payload.title))
        .with({ type: 'FETCH_ALL_DATA_REQUESTED' }, ({ payload }) => Handlers.fetchAllData(payload.drawId))
        .with({ type: 'FETCH_REWARDS_SUCCEEDED' }, (msg) => Handlers.handleRewardsSuccess('payload' in msg ? msg.payload : null))
        .with({ type: 'FETCH_REWARDS_FAILED' }, (msg) => Handlers.handleRewardsFailure('payload' in msg ? msg.payload : null))
        .with({ type: 'FETCH_RULES_SUCCEEDED' }, (msg) => Handlers.handleRulesSuccess('payload' in msg ? msg.payload : null))
        .with({ type: 'FETCH_RULES_FAILED' }, (msg) => Handlers.handleRulesFailure('payload' in msg ? msg.payload : null))
        .with({ type: 'FETCH_USER_WINNINGS_SUCCEEDED' }, (msg) => Handlers.handleUserWinningsSuccess('payload' in msg ? msg.payload : null))
        .with({ type: 'FETCH_USER_WINNINGS_FAILED' }, (msg) => Handlers.handleUserWinningsFailure('payload' in msg ? msg.payload : null))
        .with({ type: 'GO_BACK_CLICKED' }, () => Handlers.goBack())
        .exhaustive();
};
