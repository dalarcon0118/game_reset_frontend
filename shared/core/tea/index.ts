/**
 * TEA Engine - Nueva implementación con características avanzadas
 * 
 * Características:
 * - API dual (positional + config object)
 * - Global StoreRegistry
 * - Registro global de middleware y effect handlers
 * - StoreSandbox para composición de stores
 */

// Engine principal
export { createElmStore, registerEffectHandlers, registerMiddlewares } from './engine';

// Store Registry
export { StoreRegistry } from './store_registry';

// Sandbox
export { createStoreSandbox } from './sandbox';

// Types
export type { ElmStore, UpdateResult, ElmStoreConfig, StoreState } from './types';
export type { StoreSandbox, EffectHandler, StoreFactory, MsgWithReply } from './types';
