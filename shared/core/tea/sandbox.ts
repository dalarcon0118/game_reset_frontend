/**
 * StoreSandbox - Mediator for composing stores
 * 
 * Allows lazy registration and communication between stores
 * without modifying the engine.
 */

import { ElmStore, StoreFactory } from './types';
import { logger } from '../../utils/logger';

const log = logger.withTag('SANDBOX');

/**
 * StoreSandbox interface
 */
export interface StoreSandbox {
    /**
     * Register a store (lazy factory)
     */
    register<TModel, TMsg>(
        id: string,
        factory: StoreFactory<TModel, TMsg>
    ): void;

    /**
     * Get a store (creates if doesn't exist + auto-init)
     */
    get<TModel, TMsg>(id: string): ElmStore<TModel, TMsg> | null;

    /**
     * Check if registered
     */
    has(id: string): boolean;

    /**
     * List registered IDs
     */
    keys(): string[];

    /**
     * Send message to a store
     */
    send(id: string, msg: any): void;

    /**
     * Destroy all registered stores
     */
    destroy(): void;
}

/**
 * Create a new StoreSandbox
 */
export const createStoreSandbox = (): StoreSandbox => {
    const factories = new Map<string, StoreFactory>();
    const instances = new Map<string, ElmStore>();
    const pendingInit = new Set<string>();

    return {
        register<TModel, TMsg>(
            id: string,
            factory: StoreFactory<TModel, TMsg>
        ): void {
            if (factories.has(id)) {
                log.warn(`Store "${id}" already registered, overwriting`, 'SANDBOX');
            }
            factories.set(id, factory as StoreFactory);
            log.debug(`Store registered: ${id}`, 'SANDBOX');
        },

        get<TModel, TMsg>(id: string): ElmStore<TModel, TMsg> | null {
            if (!factories.has(id)) {
                log.error(
                    `Store "${id}" not found in sandbox. Available: ${Array.from(factories.keys()).join(', ')}`,
                    'SANDBOX'
                );
                return null;
            }

            // Lazy: create only when needed
            if (!instances.has(id)) {
                const factory = factories.get(id);
                if (!factory) return null;
                log.debug(`Creating lazy store: ${id}`, 'SANDBOX');
                instances.set(id, factory());
            }

            const store = instances.get(id);
            if (!store) return null;

            // Auto-init first time
            if (!pendingInit.has(id)) {
                log.debug(`Auto-init store: ${id}`, 'SANDBOX');
                const state = store.getState();
                if (state && state.init) {
                    state.init();
                }
                pendingInit.add(id);
            }

            return store as ElmStore<TModel, TMsg>;
        },

        has(id: string): boolean {
            return factories.has(id);
        },

        keys(): string[] {
            return Array.from(factories.keys());
        },

        send(id: string, msg: any): void {
            const store = this.get(id);
            if (store) {
                const state = store.getState();
                if (state && state.dispatch) {
                    state.dispatch(msg);
                }
            } else {
                log.warn(`Cannot send to unregistered store: ${id}`, 'SANDBOX');
            }
        },

        destroy(): void {
            log.debug('Destroying sandbox', 'SANDBOX');

            instances.forEach((store, id) => {
                try {
                    const state = store.getState();
                    if (state && state.cleanup) {
                        state.cleanup();
                    }
                    log.debug(`Cleaned up store: ${id}`, 'SANDBOX');
                } catch (e) {
                    log.error(`Error cleaning store: ${id}`, 'SANDBOX', e);
                }
            });

            instances.clear();
            factories.clear();
            pendingInit.clear();
        }
    };
};
