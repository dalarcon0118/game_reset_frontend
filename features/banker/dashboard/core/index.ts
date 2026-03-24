/**
 * 🏛️ CORE MODULE ENTRY POINT
 * Exports all necessary tools to interact with the Banker Dashboard logic.
 */

// 1. Store & Hooks (Primary API)
export {
    BankerDashboardModule,
    BankerDashboardStoreProvider,
    useBankerDashboardStore,
    useBankerDashboardDispatch,
    useBankerDashboardStoreApi,
    useBankerDashboardModel,
    initialBankerDashboardModel,
    type BankerDashboardModuleParams
} from './store';

// 2. Types, ViewModels & Selectors
export * from './model';
export * from './msg';
