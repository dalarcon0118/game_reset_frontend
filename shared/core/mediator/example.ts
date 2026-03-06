/**
 * Mediator Example - Improved implementation with proper onRegister
 * 
 * This example shows how to properly integrate TeaMediator with TEA stores
 * using the improved API with full context on onRegister
 */

import { createMediator } from './factory';
import { TeaResolver, TeaMediator, MsgWithCorrelation, StoreRegistration, ResolverContext } from './types';
import { Cmd } from '../tea-utils/cmd';
import { ElmStore } from '../tea/types';

// ============================================
// Example: Types
// ============================================

interface BetModel {
    id: string | null;
    amount: number;
    loading: boolean;
    error: string | null;
}

type BetMsg =
    | { type: 'FETCH_BET'; id: string }
    | { type: 'BET_LOADED'; data: BetData }
    | { type: 'BET_ERROR'; error: string };

interface BetData {
    id: string;
    amount: number;
    status: 'pending' | 'confirmed';
}

// ============================================
// Example: Improved TeaResolver with proper context
// ============================================

/**
 * Creates a TeaResolver with proper integration
 * 
 * The key improvement: onRegister now receives FULL context:
 * - storeId
 * - store instance  
 * - messageTypes that this store handles
 */
const createTeaResolver = <Store extends ElmStore = ElmStore>(): TeaResolver<Store> => {
    // Internal state for routing
    const stores = new Map<string, Store>();
    const messageHandlers = new Map<string, string>();

    // Context for global dispatch
    let dispatch: ((msg: any) => void) | null = null;

    return {
        /**
         * Initialize the resolver with global context
         */
        init: (context: ResolverContext<Store>) => {
            dispatch = context.dispatch;
            console.log('[Resolver] Initialized with dispatch');
        },

        /**
         * Called when a store is registered with message types
         * NOW receives full context!
         */
        onRegister: (registration: StoreRegistration) => {
            const { storeId, store, messageTypes } = registration;

            // Store the reference
            stores.set(storeId, store as Store);

            // Map each message type to this store
            messageTypes.forEach(msgType => {
                messageHandlers.set(msgType, storeId);
            });

            console.log(`[Resolver] Registered store: ${storeId} handling: ${messageTypes.join(', ')}`);
        },

        /**
         * Find which store can handle this message
         */
        onSend: (msg: MsgWithCorrelation): Store | null => {
            const storeId = messageHandlers.get(msg.type);

            if (!storeId) {
                console.warn(`[Resolver] No handler for message: ${msg.type}`);
                return null;
            }

            const store = stores.get(storeId);
            if (!store) {
                console.warn(`[Resolver] Store not found: ${storeId}`);
                return null;
            }

            console.log(`[Resolver] Routing ${msg.type} to ${storeId}`);
            return store;
        },

        /**
         * Find the origin store for a response
         */
        onReply: (msg: MsgWithCorrelation): Store | null => {
            // Find by responseTo correlation ID
            const storeId = msg.responseTo;

            if (!storeId) {
                console.warn('[Resolver] No correlation ID in reply');
                return null;
            }

            // In a real implementation, you'd track origins separately
            // For now, just return null and let the mediator handle it
            return null;
        }
    };
};

// ============================================
// Example: Complete integration
// ============================================

/**
 * Full example of setting up a mediator with stores
 */
const createBetSystem = () => {
    // 1. Create resolver
    const resolver = createTeaResolver();

    // 2. Create mediator
    const mediator = createMediator('BetMediator', resolver, { debug: true });

    // 3. Initialize with global dispatch (will be called from TEA engine)
    const globalDispatch = (msg: any) => {
        console.log('[Global] Dispatch:', msg.type);
    };
    mediator.init(globalDispatch);

    // 4. Register stores with their message types
    // Format: register(storeId, factory, [messageTypes])
    mediator.register('repository', () => {
        // This would be createElmStore in real app
        return ((msg: any) => {
            console.log('[RepositoryStore] Received:', msg.type);
        }) as unknown as ElmStore;
    }, ['FETCH_BET', 'CREATE_BET']);

    mediator.register('validator', () => {
        return ((msg: any) => {
            console.log('[ValidatorStore] Received:', msg.type);
        }) as unknown as ElmStore;
    }, ['VALIDATE_BET']);

    return mediator;
};

// ============================================
// Example: Usage in a TEA store
// ============================================

/**
 * Example of using the mediator in a TEA store's update function
 */
const exampleUpdate = (model: BetModel, msg: BetMsg): [BetModel, Cmd] => {
    // This would be inside your createElmStore setup
    const mediator = createBetSystem();

    switch (msg.type) {
        case 'FETCH_BET':
            // Send request to repository store
            return [
                { ...model, loading: true },
                mediator.send(
                    { type: 'FETCH_BET', id: msg.id },
                    { type: 'BET_LOADED' },
                    'ui' // origin store ID
                )
            ];

        case 'BET_LOADED':
            return [
                {
                    ...model,
                    id: msg.data.id,
                    amount: msg.data.amount,
                    loading: false
                },
                Cmd.none
            ];

        default:
            return [model, Cmd.none];
    }
};

// ============================================
// Export
// ============================================

export {
    createTeaResolver,
    createBetSystem,
    exampleUpdate,
    BetModel,
    BetMsg,
    BetData
};
