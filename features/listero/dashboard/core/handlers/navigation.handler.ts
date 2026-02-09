import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd } from '@/shared/core/cmd';
import { routes } from '@/config';
import { ret, singleton, Return } from '@/shared/core/return';

export const NavigationHandler = {
    handleRulesClicked: (model: Model, drawId: string): Return<Model, Msg> => {
        console.log('[DASHBOARD] RULES_CLICKED - Navigating to:', routes.lister.bets_rules.screen, 'with id:', drawId);
        return ret(model, Cmd.navigate({ pathname: routes.lister.bets_rules.screen, params: { id: drawId } }));
    },

    handleRewardsClicked: (model: Model, drawId: string, title: string): Return<Model, Msg> => {
        console.log('[DASHBOARD] REWARDS_CLICKED - Navigating to:', routes.lister.rewards.screen, 'with id:', drawId, 'title:', title);
        return ret(model, Cmd.navigate({ pathname: routes.lister.rewards.screen, params: { id: drawId, title } }));
    },

    handleBetsListClicked: (model: Model, drawId: string, title: string): Return<Model, Msg> => {
        return ret(model, Cmd.navigate({ pathname: routes.lister.bets_list.screen, params: { id: drawId, title } }));
    },

    handleCreateBetClicked: (model: Model, drawId: string, title: string): Return<Model, Msg> => {
        return ret(model, Cmd.navigate({ pathname: routes.lister.bets_create.screen, params: { id: drawId, title } }));
    },

    handleNavigateToError: (model: Model): Return<Model, Msg> => {
        return ret(model, Cmd.navigate({ pathname: '/error' }));
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
