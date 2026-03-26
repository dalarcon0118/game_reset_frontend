/**
 * 🏛️ CORE MODULE ENTRY POINT
 * Exports all necessary tools to interact with the Drawers logic.
 */

// 1. Store & Hooks (Primary API)
export {
    DrawersModule,
    DrawersStoreProvider,
    useDrawersStore,
    useDrawersDispatch,
    selectDrawersModel,
    selectDrawersDispatch
} from './store';

// 2. Types & Selectors (Including selectDrawersViewModel)
export * from './model';
export * from './msg';