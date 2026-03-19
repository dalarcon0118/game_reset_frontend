import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd, Sub, ret, singleton } from '@core/tea-utils';
import { updateFeature } from './feature.update';
import { LoteriaFeatureModel, FeatureMsg } from './feature.types';
import { initialModel } from './feature.initial';
import { FETCH_RULES_REQUESTED } from '../../bet-workspace/rules/core/types';

/**
 * 📝 LOTERIA MODULE PARAMS
 * Define what Loteria needs to start.
 */
export interface LoteriaModuleParams {
    drawId?: string;
    betType?: string;
}

/**
 * 🏗️ LOTERIA MODULE DEFINITION
 * Pure TEA definition of the Loteria feature.
 */
const loteriaDefinition = defineTeaModule<LoteriaFeatureModel, FeatureMsg>({
    name: 'Loteria',
    initial: (params: LoteriaModuleParams = {}) => {
        const model: LoteriaFeatureModel = {
            ...initialModel,
            currentDrawId: params.drawId || null,
            rulesSession: {
                ...initialModel.rulesSession,
                currentDrawId: params.drawId || null
            }
        };

        if (params.drawId) {
            return ret(model, Cmd.ofMsg({ type: 'FETCH_RULES_REQUESTED', payload: { drawId: params.drawId } } as any));
        }

        return singleton(model);
    },
    update: (model, msg) => updateFeature(model, msg),
    subscriptions: () => Sub.none()
});

/**
 * 🏪 LOTERIA MODULE INSTANCE
 * Result of createTEAModule, containing the Provider and hooks.
 */
export const LoteriaModule = createTEAModule(loteriaDefinition);

// Public API Hooks
export const LoteriaStoreProvider = LoteriaModule.Provider;
export const useLoteriaStore = LoteriaModule.useStore;
export const useLoteriaDispatch = LoteriaModule.useDispatch;
export const useLoteriaStoreApi = LoteriaModule.useStoreApi;

// Optimized Model Hook
export const useLoteriaModel = () => useLoteriaStore(s => s.model);

/**
 * 🔄 LEGACY COMPATIBILITY
 */
export const selectLoteriaModel = (state: { model: LoteriaFeatureModel }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: FeatureMsg) => void }) => state.dispatch;
