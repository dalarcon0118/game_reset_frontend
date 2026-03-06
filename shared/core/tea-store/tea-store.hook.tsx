import { useEffect } from 'react';
import { createElmStore } from '../engine/engine';
import { effectHandlers } from '../tea-utils/effect_handlers';
import { createTEAStoreUpdate } from './tea-store.update';
import { TEAStoreConfig, TEAStoreState, TEAStoreMsg, Entity } from './tea-store.types';

/**
 * React hook for using TEAStore in components.
 * 
 * This hook creates a Zustand store with TEA architecture and provides
 * convenient methods for all CRUD operations.
 * 
 * @param config - Configuration object with CRUD service functions
 * @param autoFetch - Whether to automatically fetch all items on mount (default: true)
 * @returns Object containing state, dispatch, actions, and store reference
 * 
 * @example
 * const { model, actions } = useTEAStore<User>({
 *     fetchAll: userService.fetchAll,
 *     fetchOne: userService.fetchOne,
 *     create: userService.create,
 *     update: userService.update,
 *     delete: userService.delete,
 * });
 * 
 * // Access state
 * model.items        // WebData<User[]>
 * model.selectedItem // WebData<User>
 * model.operationStatus // WebData<User>
 * 
 * // Use actions
 * actions.fetchAll();
 * actions.create({ name: 'John', email: 'john@example.com' });
 * actions.update(userId, { name: 'Jane' });
 * actions.delete(userId);
 */
export const useTEAStore = <T extends Entity>(
    config: TEAStoreConfig<T>,
    autoFetch: boolean = true
) => {
    const { initial, update } = createTEAStoreUpdate(config);
    
    const store = createElmStore(
        initial,
        update,
        effectHandlers
    );

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (autoFetch) {
            store.getState().dispatch({ type: 'FETCH_ALL_REQUESTED' });
        }
    }, [autoFetch, store]);

    return {
        /**
         * Current store state
         */
        model: store.getState().model,
        
        /**
         * Dispatch function for sending messages to the store
         */
        dispatch: store.getState().dispatch,
        
        /**
         * Convenience methods for common operations
         */
        actions: {
            /**
             * Fetch all entities
             */
            fetchAll: () => store.getState().dispatch({ type: 'FETCH_ALL_REQUESTED' }),
            
            /**
             * Fetch a single entity by ID
             * @param id - The entity ID to fetch
             */
            fetchOne: (id: string) => store.getState().dispatch({ type: 'FETCH_ONE_REQUESTED', id }),
            
            /**
             * Create a new entity
             * @param data - The entity data without the id field
             */
            create: (data: Omit<T, 'id'>) => store.getState().dispatch({ type: 'CREATE_REQUESTED', data }),
            
            /**
             * Update an existing entity
             * @param id - The ID of the entity to update
             * @param data - Partial data to update on the entity
             */
            update: (id: string, data: Partial<T>) => store.getState().dispatch({ type: 'UPDATE_REQUESTED', id, data }),
            
            /**
             * Delete an entity
             * @param id - The ID of the entity to delete
             */
            delete: (id: string) => store.getState().dispatch({ type: 'DELETE_REQUESTED', id }),
            
            /**
             * Select an entity (for detail view or editing)
             * @param id - The entity ID to select, or null to deselect
             */
            selectItem: (id: string | null) => store.getState().dispatch({ type: 'SELECT_ITEM', id }),
            
            /**
             * Start create mode (show form for new entity)
             */
            startCreate: () => store.getState().dispatch({ type: 'START_CREATE' }),
            
            /**
             * Start edit mode (show form for existing entity)
             * @param id - The ID of the entity to edit
             */
            startEdit: (id: string) => store.getState().dispatch({ type: 'START_EDIT', id }),
            
            /**
             * Cancel create/edit mode
             */
            cancelEdit: () => store.getState().dispatch({ type: 'CANCEL_EDIT' }),
            
            /**
             * Clear operation status (error/success)
             */
            clearError: () => store.getState().dispatch({ type: 'CLEAR_ERROR' }),
            
            /**
             * Reset store to initial state
             */
            reset: () => store.getState().dispatch({ type: 'RESET' }),
        },
        
        /**
         * Store reference for advanced usage
         * Can be used to subscribe to state changes or access store methods directly
         */
        store
    };
};
