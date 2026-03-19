import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd, Sub, ret } from '@core/tea-utils';
import { BolitaModel } from '../domain/models/bolita.types';
import { initialBolitaModel } from '../domain/models/bolita.initial';
import { update } from '../application/bolita';
import { BolitaMsg, APPLY_PROMOTION_CONTEXT } from '../domain/models/bolita.messages';

/**
 * 📝 BOLITA MODULE PARAMS
 * Define what Bolita needs to start.
 */
export interface BolitaModuleParams {
    drawId?: string;
    betType?: string;
}

/**
 * 🏗️ BOLITA MODULE DEFINITION
 * Pure TEA definition of the Bolita feature.
 */
const bolitaDefinition = defineTeaModule<BolitaModel, BolitaMsg>({
    name: 'Bolita',
    initial: (params: BolitaModuleParams = {}) => {
        const model = {
            ...initialBolitaModel,
            currentDrawId: params.drawId || null
        };

        // If we have a betType (from a promotion), trigger the configuration
        if (params.betType) {
            return ret(model, Cmd.ofMsg(APPLY_PROMOTION_CONTEXT({ betType: params.betType })));
        }

        return [model, Cmd.none];
    },
    update,
    subscriptions: () => Sub.none()
});

/**
 * 🏪 BOLITA MODULE INSTANCE
 * Result of createTEAModule, containing the Provider and hooks.
 * Following the TEA Clean Feature Design.
 */
export const BolitaModule = createTEAModule(bolitaDefinition);

// Public API Hooks
export const BolitaStoreProvider = BolitaModule.Provider;
export const useBolitaStore = BolitaModule.useStore;
export const useBolitaDispatch = BolitaModule.useDispatch;
export const useBolitaStoreApi = BolitaModule.useStoreApi;

// Optimized Model Hook
export const useBolitaModel = () => useBolitaStore(s => s.model);

/**
 * 🔄 LEGACY COMPATIBILITY
 * These are kept to avoid breaking existing hooks and screens.
 */
export const selectBolitaModel = (state: { model: BolitaModel }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: BolitaMsg) => void }) => state.dispatch;
