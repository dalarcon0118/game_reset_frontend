
import { Feature } from '@/shared/core/architecture/interfaces';
import { Model } from './core/model';
import { initialState } from './core/initial.types';
import { Msg } from './core/msg';
import { update } from './core/update';
import { subscriptions } from './core/subscriptions';
import { Cmd } from '@/shared/core/cmd';
import { DashboardGateway } from './gateways/external.gateway';

// Register the gateway immediately at module load time.
// Previously this was inside configure(), which was only called when a config
// object was passed to registerFeature() — which never happened.
// DashboardGateway is now self-contained and does not need registration.

export const DashboardFeature: Feature<Model, Msg> = {
    id: 'DASHBOARD',

    init: () => {
        return [initialState, Cmd.none];
    },

    update: (msg, state) => {
        const [nextState, cmd] = update(state, msg);
        return [nextState, cmd];
    },

    subscriptions: (state) => {
        return subscriptions(state);
    },
};

