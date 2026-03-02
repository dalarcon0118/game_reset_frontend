/**
 * Global TEA Resolver - Single resolver for all mediators
 * 
 * This module provides a global resolver that can be shared across
 * all TEA stores and mediators in the application.
 * 
 * Instead of creating individual resolvers for each mediator,
 * you can use this global one to:
 * - Route messages across all registered stores
 * - Track message types globally
 * - Handle cross-store communication uniformly
 */

import { TeaResolver, StoreRegistration, ResolverContext, MsgWithCorrelation } from './types';
import { logger } from '../../utils/logger';
import { createMediator, TeaMediator } from './factory';

const log = logger.withTag('GLOBAL_RESOLVER');

/**
 * Global state for the resolver
 */
interface GlobalState {
    /** Map of storeId -> store instance */
    stores: Map<string, any>;
    /** Map of messageType -> storeId (which store handles which message) */
    messageHandlers: Map<string, string>;
    /** Map of correlationId -> originStoreId */
    correlations: Map<string, string>;
    /** All registered mediators */
    mediators: Map<string, TeaMediator>;
    /** Context provided by initialization */
    context: ResolverContext | null;
}

/**
 * Create a global TEA resolver
 * 
 * This resolver can be shared across multiple mediators,
 * providing unified message routing.
 * 
 * @param options Configuration options
 */
export const createGlobalResolver = (options?: {
    debug?: boolean;
}): TeaResolver => {
    const state: GlobalState = {
        stores: new Map(),
        messageHandlers: new Map(),
        correlations: new Map(),
        mediators: new Map(),
        context: null,
    };

    const debug = options?.debug ?? __DEV__;

    return {
        init: (context: ResolverContext) => {
            state.context = context;
            if (debug) {
                log.debug('Global resolver initialized');
            }
        },

        onRegister: (registration: StoreRegistration) => {
            const { storeId, store, messageTypes } = registration;

            // Store the instance
            state.stores.set(storeId, store);

            // Register message types
            messageTypes.forEach(msgType => {
                state.messageHandlers.set(msgType, storeId);
            });

            if (debug) {
                log.debug(`Global resolver: registered store "${storeId}" for [${messageTypes.join(', ')}]`);
            }
        },

        onSend: (msg: MsgWithCorrelation): any | null => {
            const { type, correlationId, originStoreId } = msg;

            // Track correlation for responses
            if (correlationId && originStoreId) {
                state.correlations.set(correlationId, originStoreId);
            }

            // Find the store that handles this message type
            const storeId = state.messageHandlers.get(type);

            if (storeId) {
                const store = state.stores.get(storeId);
                if (debug) {
                    log.debug(`Global resolver: routing ${type} -> ${storeId}`);
                }
                return store;
            }

            // No store found for this message type
            if (debug) {
                log.warn(`Global resolver: no store registered to handle ${type}`);
            }
            return null;
        },

        onReply: (msg: MsgWithCorrelation): any | null => {
            const { responseTo, correlationId } = msg;
            const corrId = responseTo || correlationId;

            if (corrId) {
                const originStoreId = state.correlations.get(corrId);

                if (originStoreId) {
                    const store = state.stores.get(originStoreId);
                    if (debug) {
                        log.debug(`Global resolver: routing reply to ${originStoreId} (correlation: ${corrId})`);
                    }
                    // Clean up correlation
                    state.correlations.delete(corrId);
                    return store;
                }
            }

            return null;
        },
    };
};

/**
 * Register a mediator with the global resolver
 * 
 * This allows the global resolver to track which mediators exist
 * and route messages appropriately.
 */
export const registerMediator = (
    state: GlobalState,
    name: string,
    mediator: TeaMediator
): void => {
    state.mediators.set(name, mediator);

    if (__DEV__) {
        log.debug(`Registered mediator: ${name}`);
    }
};

/**
 * Get a store by ID from the global state
 */
export const getStore = (state: GlobalState, storeId: string): any | null => {
    return state.stores.get(storeId) || null;
};

/**
 * Get all registered message types
 */
export const getHandledMessages = (state: GlobalState): string[] => {
    return Array.from(state.messageHandlers.keys());
};

/**
 * Create a pre-configured mediator with the global resolver
 * 
 * This is a convenience function to create mediators that
 * automatically use the global resolver.
 */
export const createGlobalMediator = (
    name: string,
    globalResolver: TeaResolver,
    config?: { debug?: boolean }
): TeaMediator => {
    const mediator = createMediator(name, globalResolver, config);
    return mediator;
};

/**
 * Singleton global resolver instance
 */
let globalResolverInstance: TeaResolver | null = null;

/**
 * Get the global resolver singleton
 * Creates one if it doesn't exist
 */
export const getGlobalResolver = (): TeaResolver => {
    if (!globalResolverInstance) {
        globalResolverInstance = createGlobalResolver({ debug: __DEV__ });
    }
    return globalResolverInstance;
};

/**
 * Reset the global resolver (useful for testing)
 */
export const resetGlobalResolver = (): void => {
    globalResolverInstance = null;
};

/**
 * Example: How to use the global resolver
 * 
 * ```typescript
 * import { getGlobalResolver, createGlobalMediator } from './global_resolver';
 * import { createListStore } from '@/features/list/store';
 * import { createDrawStore } from '@/features/draw/store';
 * 
 * // 1. Get the global resolver (singleton)
 * const globalResolver = getGlobalResolver();
 * 
 * // 2. Create mediators using the global resolver
 * const betMediator = createGlobalMediator('bet-system', globalResolver);
 * const drawMediator = createGlobalMediator('draw-system', globalResolver);
 * 
 * // 3. Register stores (they will be tracked by the global resolver)
 * betMediator.register('list', () => createListStore(), ['FETCH_BETS', 'CREATE_BET']);
 * drawMediator.register('draws', () => createDrawStore(), ['FETCH_DRAWS', 'CLOSE_DRAW']);
 * 
 * // 4. Initialize with dispatch
 * betMediator.init(globalDispatch);
 * drawMediator.init(globalDispatch);
 * 
 * // Now all stores can communicate through the global resolver!
 * ```
 */
