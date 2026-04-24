import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd, ret, singleton, Return } from '@core/tea-utils';
import { routes } from '@/config';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_NAV_HANDLER');

export const NavigationHandler = {
    handleRulesClicked: (model: Model, drawId: string): Return<Model, Msg> => {
        log.debug('Rules clicked, navigating', { screen: routes.lister.bets_rules.screen, drawId });
        return ret(model, Cmd.navigate({ pathname: routes.lister.bets_rules.screen, params: { id: drawId } }));
    },

    handleRewardsClicked: (model: Model, drawId: string, title: string): Return<Model, Msg> => {
        log.debug('Rewards clicked, navigating', { screen: routes.lister.rewards.screen, drawId, title });
        return ret(model, Cmd.navigate({ pathname: routes.lister.rewards.screen, params: { id: drawId, title } }));
    },

    handleCreateBetClicked: (model: Model, drawId: string, title: string, drawType?: string): Return<Model, Msg> => {
        let pathname: string;
        switch (drawType) {
            case 'BL':
                pathname = '/lister/bets/bolita/anotate';
                break;
            case 'LS_WEEKLY':
                pathname = '/lister/bets/loteria/anotate';
                break;
            default:
                pathname = routes.lister.bets_create.screen;
                break;
        }
        return ret(model, Cmd.navigate({ pathname, params: { id: drawId, title } }));
    },

    handleBetsListClicked: (model: Model, drawId: string, title: string, drawType?: string): Return<Model, Msg> => {
        let pathname: string;
        switch (drawType) {
            case 'BL':
                pathname = '/lister/bets/bolita/list';
                break;
            case 'LS_WEEKLY':
                pathname = '/lister/bets/loteria/list';
                break;
            default:
                pathname = routes.lister.bets_list.screen;
                break;
        }
        return ret(model, Cmd.navigate({ pathname, params: { id: drawId, title } }));
    },

    handleHelpClicked: (model: Model): Return<Model, Msg> => {
        return ret(model, Cmd.navigate({ pathname: '/help' }));
    },

    handleNotificationsClicked: (model: Model): Return<Model, Msg> => {
        return ret(model, Cmd.navigate({ pathname: '/notifications' }));
    },

    handleSettingsClicked: (model: Model): Return<Model, Msg> => {
        return ret(model, Cmd.navigate({ pathname: routes.lister.profile.screen }));
    }
};
