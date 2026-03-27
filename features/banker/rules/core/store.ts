import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd } from '@core/tea-utils';
import { Model, initialState } from './model';
import { Msg } from './msg';
import { update, subscriptions } from './update';

/**
 * 🏗️ BANKER RULES MODULE DEFINITION
 * Pure TEA definition using the TeaModuleDefinition pattern.
 */
export const bankerRulesDefinition = defineTeaModule<Model, Msg>({
    name: 'BankerRules',
    initial: () => {
        return [initialState, Cmd.none];
    },
    update,
    subscriptions,
});

/**
 * 🏪 BANKER RULES MODULE INSTANCE
 * Result of createTEAModule, providing Provider and hooks.
 */
export const BankerRulesModule = createTEAModule(bankerRulesDefinition);

// --- PUBLIC API HOOKS ---

export const BankerRulesStoreProvider = BankerRulesModule.Provider;

/** Hook to access the full store (model + dispatch) */
export const useBankerRulesStore = BankerRulesModule.useStore;

/** Hook to access only the dispatch */
export const useBankerRulesDispatch = BankerRulesModule.useDispatch;

/** Hook to access the store API (getState, subscribe, etc.) */
export const useBankerRulesStoreApi = BankerRulesModule.useStoreApi;

/** Optimized Hook to access only the model */
export const useBankerRulesModel = () => useBankerRulesStore(s => s.model);
