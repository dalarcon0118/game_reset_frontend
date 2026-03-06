import { useEffect, useMemo } from 'react';
import { createElmStore } from '../engine/engine';
import { createTEAStoreUpdate } from './tea-store.update';
import { TEAStoreConfig, TEAStoreState, TEAStoreMsg, TEAStoreMsgType, Entity } from './tea-store.types';

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
 */
export const useTEAStore = <T extends Entity>(
    config: TEAStoreConfig<T>,
    autoFetch: boolean = true
) => {
    // Memoize the store to avoid recreation on every render
    const store = useMemo(() => {
        const { initial, update } = createTEAStoreUpdate(config);
        
        return createElmStore<TEAStoreState<T>, TEAStoreMsg<T>>({
            initial,
            update
        });
    }, [config]);

    const { model, dispatch, actions } = useMemo(() => {
        const state = store.getState();
        
        return {
            model: state.model,
            dispatch: state.dispatch,
            actions: {
                fetchAll: () => state.dispatch({ type: TEAStoreMsgType.FETCH_ALL_REQUESTED }),
                fetchOne: (id: string) => state.dispatch({ type: TEAStoreMsgType.FETCH_ONE_REQUESTED, id }),
                create: (data: Omit<T, 'id'>) => state.dispatch({ type: TEAStoreMsgType.CREATE_REQUESTED, data }),
                update: (id: string, data: Partial<T>) => state.dispatch({ type: TEAStoreMsgType.UPDATE_REQUESTED, id, data }),
                delete: (id: string) => state.dispatch({ type: TEAStoreMsgType.DELETE_REQUESTED, id }),
                selectItem: (id: string | null) => state.dispatch({ type: TEAStoreMsgType.SELECT_ITEM, id }),
                startCreate: () => state.dispatch({ type: TEAStoreMsgType.START_CREATE }),
                startEdit: (id: string) => state.dispatch({ type: TEAStoreMsgType.START_EDIT, id }),
                cancelEdit: () => state.dispatch({ type: TEAStoreMsgType.CANCEL_EDIT }),
                clearError: () => state.dispatch({ type: TEAStoreMsgType.CLEAR_ERROR }),
                reset: () => state.dispatch({ type: TEAStoreMsgType.RESET }),
            }
        };
    }, [store]);

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (autoFetch) {
            dispatch({ type: TEAStoreMsgType.FETCH_ALL_REQUESTED });
        }
    }, [autoFetch, dispatch]);

    return {
        model,
        dispatch,
        actions,
        store
    };
};

