import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd, RemoteData } from '@core/tea-utils';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions } from './update';

/**
 * 📝 BANKER DASHBOARD MODULE PARAMS
 * Define what the Banker Dashboard needs to start.
 */
export interface BankerDashboardModuleParams {
    structureId?: string;
}

/**
 * 🛠️ INITIAL MODEL
 */
export const initialBankerDashboardModel: Model = {
    agencies: RemoteData.notAsked(),
    summary: RemoteData.notAsked(),
    selectedAgencyId: null,
    isSystemReady: false,
    userStructureId: null,
};

/**
 * 🏗️ BANKER DASHBOARD MODULE DEFINITION
 * Pure TEA definition using the TeaModuleDefinition pattern.
 */
export const bankerDashboardDefinition = defineTeaModule<Model, Msg>({
    name: 'BankerDashboard',
    initial: () => {
        return [initialBankerDashboardModel, Cmd.none];
    },
    update,
    subscriptions,
});

/**
 * 🏪 BANKER DASHBOARD MODULE INSTANCE
 * Result of createTEAModule, providing Provider and hooks.
 * This is the modern way to use TEA in this project.
 */
export const BankerDashboardModule = createTEAModule(bankerDashboardDefinition);

// --- PUBLIC API HOOKS ---

export const BankerDashboardStoreProvider = BankerDashboardModule.Provider;

/** Hook to access the full store (model + dispatch) */
export const useBankerDashboardStore = BankerDashboardModule.useStore;

/** Hook to access only the dispatch function */
export const useBankerDashboardDispatch = BankerDashboardModule.useDispatch;

/** Hook to access the store API (getState, subscribe, etc.) */
export const useBankerDashboardStoreApi = BankerDashboardModule.useStoreApi;

/** Optimized Hook to access only the model */
export const useBankerDashboardModel = () => useBankerDashboardStore(s => s.model);
