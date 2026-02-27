/**
 * Global Store Registry
 * 
 * Allows getting existing stores by ID without creating new ones.
 */

import { ElmStore, StoreState } from './types';
import { logger } from '../../utils/logger';

const log = logger.withTag('STORE_REGISTRY');

/**
 * Global registry for stores
 */
class StoreRegistryImpl {
    private stores = new Map<string, ElmStore>();

    /**
     * Register a store with ID
     */
    register<TModel = any, TMsg = any>(
        id: string,
        store: ElmStore<TModel, TMsg>
    ): void {
        if (this.stores.has(id)) {
            log.warn(`Store "${id}" already registered, overwriting`, 'REGISTRY');
        }
        this.stores.set(id, store as ElmStore);
        log.info(`Store registered: ${id}`, 'REGISTRY');
    }

    /**
     * Get a store by ID (does NOT create)
     */
    get<TModel = any, TMsg = any>(id: string): ElmStore<TModel, TMsg> | null {
        const store = this.stores.get(id);
        if (!store) {
            log.error(
                `Store "${id}" not found. Available: ${Array.from(this.stores.keys()).join(', ')}`,
                'REGISTRY'
            );
            return null;
        }
        return store as ElmStore<TModel, TMsg>;
    }

    /**
     * Check if store exists
     */
    has(id: string): boolean {
        return this.stores.has(id);
    }

    /**
     * Get all registered store IDs
     */
    keys(): string[] {
        return Array.from(this.stores.keys());
    }

    /**
     * Get all stores
     */
    entries(): [string, ElmStore][] {
        return Array.from(this.stores.entries());
    }

    /**
     * Unregister a store
     */
    unregister(id: string): void {
        this.stores.delete(id);
        log.info(`Store unregistered: ${id}`, 'REGISTRY');
    }

    /**
     * Cleanup all stores
     */
    destroyAll(): void {
        this.stores.forEach((store, id) => {
            try {
                store.getState().cleanup?.();
            } catch (e) {
                log.error(`Error cleaning store: ${id}`, 'REGISTRY', e);
            }
        });
        this.stores.clear();
        log.info('All stores destroyed', 'REGISTRY');
    }
}

/**
 * Global store registry singleton
 */
export const StoreRegistry = new StoreRegistryImpl();
