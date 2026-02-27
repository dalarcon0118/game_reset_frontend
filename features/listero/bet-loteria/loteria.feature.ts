import { Feature, FeatureAdapter } from '@/shared/core/architecture/interfaces';
import { LoteriaFeatureModel, FeatureMsg } from './core/feature.types';
import { updateFeature } from './core/feature.update';
import { initialModel } from './core/store'; // Assuming initialModel is exported from store or types

/**
 * Loteria Feature Adapter
 * Translates between global workspace messages and internal Loteria feature messages.
 */
const LoteriaAdapter: FeatureAdapter<FeatureMsg, any> = {
    lift: (msg: FeatureMsg) => ({ type: 'LOTERIA_FEATURE', payload: msg }),
    lower: (msg: any): FeatureMsg | null => {
        if (msg.type === 'LOTERIA_FEATURE') return msg.payload;

        // Also handle direct messages if they are routed by type
        if (msg.type === 'LOTERIA' || msg.type === 'LIST' || msg.type === 'MANAGEMENT' || msg.type === 'CORE') {
            return msg as FeatureMsg;
        }

        return null;
    }
};

/**
 * Loteria Feature
 * 
 * Orchestrates the Loteria game within the Bet Workspace.
 */
export const LoteriaFeature: Feature<LoteriaFeatureModel, FeatureMsg> = {
    id: 'LOTERIA',

    adapter: LoteriaAdapter,

    init: () => {
        // We use the initial model from the store
        // If not available, we would construct it here
        return [initialModel as LoteriaFeatureModel, null];
    },

    update: (msg, state) => {
        return updateFeature(state, msg) as any;
    }
};
