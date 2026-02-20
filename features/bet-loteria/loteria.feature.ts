import { Feature } from '@/shared/core/architecture/interfaces';
import { Model as GlobalModel } from '../bet-workspace/model';
import { updateLoteria } from './loteria.update';
import { LoteriaMsg } from './loteria.types';
import { LoteriaExternalFeaturesGateway, LoteriaExternalFeaturesHandler } from './gateway';
import { Cmd } from '@/shared/core/cmd';

export const LoteriaFeature: Feature<GlobalModel, LoteriaMsg> = {
    id: 'LOTERIA',

    init: () => {
        // Loteria state is part of the global model structure for now
        return [{} as any, null];
    },

    configure: (config: { externalGateway: LoteriaExternalFeaturesHandler }) => {
        if (config.externalGateway) {
            LoteriaExternalFeaturesGateway.register(config.externalGateway);
        }
    },

    update: (msg, state) => {
        const ret = updateLoteria(state, msg);

        // If updateLoteria returns a result, use it
        if (ret.model !== state || ret.cmd !== Cmd.none) {
            return [ret.model, ret.cmd];
        }

        // External Features Delegation (Composite Pattern via Gateway)
        // If the message wasn't handled internally, try the gateway
        const gatewayResult = LoteriaExternalFeaturesGateway.receive(msg, state);
        if (gatewayResult) {
            return gatewayResult;
        }

        // If not handled by gateway either, return the original result
        return [ret.model, ret.cmd];
    },

    subscriptions: (state: GlobalModel) => {
        return LoteriaExternalFeaturesGateway.subscriptions(state);
    }
};
