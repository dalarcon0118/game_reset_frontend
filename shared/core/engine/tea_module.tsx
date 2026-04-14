import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { createElmStore } from './engine';
import { UseBoundStore, StoreApi } from 'zustand';
import { storeRegistry } from './store_registry';
import { Cmd } from '../tea-utils';

/**
 * TEA Module Definition
 * Pure data structure describing a TEA module without instantiating it.
 */
export interface TeaModuleDef<TModel, TMsg> {
    name: string;
    initial: (params?: any) => [TModel, any];
    update: (model: TModel, msg: TMsg) => [TModel, any];
    subscriptions?: (model: TModel) => any;
    effectHandlers?: Record<string, (payload: any, dispatch: (msg: TMsg) => void) => Promise<any>>;
    middlewares?: import('../tea-utils/middleware.types').TeaMiddleware<TModel, TMsg>[];
}

/**
 * TEA Module Instance
 * Result of createTEAModule, containing the Provider and hooks.
 */
export interface TeaModuleInstance<TModel, TMsg> {
    name: string;
    Provider: React.FC<{ 
        children: ReactNode; 
        initialParams?: any;
        store?: UseBoundStore<StoreApi<{ model: TModel; dispatch: (msg: TMsg) => void }>>;
    }>;
    useStore: <T = { model: TModel; dispatch: (msg: TMsg) => void }>(
        selector?: (state: { model: TModel; dispatch: (msg: TMsg) => void }) => T
    ) => T;
    useStoreApi: () => UseBoundStore<StoreApi<{ model: TModel; dispatch: (msg: TMsg) => void }>>;
    useDispatch: () => (msg: TMsg) => void;
    definition: TeaModuleDef<TModel, TMsg>;
}

/**
 * defineTeaModule
 * Utility to define a TEA module declaratively.
 */
export function defineTeaModule<TModel, TMsg>(
    def: TeaModuleDef<TModel, TMsg>
): TeaModuleDef<TModel, TMsg> {
    return def;
}

/**
 * createTEAModule
 * Factory that creates a TEA Module with its own Context and Provider.
 * This FORCES the store to be instantiated within the React lifecycle.
 */
export function createTEAModule<TModel, TMsg>(
    def: TeaModuleDef<TModel, TMsg>
): TeaModuleInstance<TModel, TMsg> {
    const Context = createContext<UseBoundStore<StoreApi<{ model: TModel; dispatch: (msg: TMsg) => void }>> | null>(null);

    const Provider: React.FC<{ 
        children: ReactNode; 
        initialParams?: any;
        store?: UseBoundStore<StoreApi<{ model: TModel; dispatch: (msg: TMsg) => void }>>;
    }> = ({ children, initialParams, store: providedStore }) => {
        const storeRef = useRef<UseBoundStore<StoreApi<{ model: TModel; dispatch: (msg: TMsg) => void }>> | null>(providedStore || null);

        if (!storeRef.current) {
            const store = createElmStore({
                initial: () => {
                    if (typeof def.initial === 'function') {
                        return def.initial(initialParams);
                    }  return [def.initial, Cmd.none];
                },
                update: def.update,
                subscriptions: def.subscriptions || (() => null),
                effectHandlers: def.effectHandlers,
                middlewares: def.middlewares,
                name: def.name
            });

           

            storeRegistry.register(def.name, store);
            storeRef.current = store as any;
        }

        const store = storeRef.current as any;

        useEffect(() => {
            return () => {
                if (!providedStore) {
                    store?.getState().cleanup?.();
                    storeRegistry.unregister(def.name);
                }
            };
        }, [store, providedStore]);

        return <Context.Provider value={store as any}>{children}</Context.Provider>;
    };

    const useStore = <T = { model: TModel; dispatch: (msg: TMsg) => void }>(
        selector?: (state: { model: TModel; dispatch: (msg: TMsg) => void }) => T
    ): T => {
        const store = useContext(Context);
        if (!store) {
            throw new Error(
                `TEA Architecture Violation: ${def.name}Store accessed without its Provider. ` +
                `Wrap your component tree with <${def.name}Module.Provider />.`
            );
        }
        
        // If selector is provided, use it. Otherwise return the whole state.
        const state = store(selector as any) as T;

        // Validation for common implementation error: destructuring dispatch from a selector that doesn't return it
        if (state && typeof state === 'object' && 'model' in state && !('dispatch' in state)) {
            // This happens when useStore(s => s.model) is called but the user tries to destructure { model, dispatch }
            // We can't fix the destructuring here, but we can log a warning if dispatch is missing from a state that looks like it should have it
        }

        return state;
    };

    const useStoreApi = () => {
        const store = useContext(Context);
        if (!store) {
            throw new Error(
                `TEA Architecture Violation: ${def.name}Store.useStoreApi accessed without its Provider. ` +
                `Wrap your component tree with <${def.name}Module.Provider />.`
            );
        }
        return store as any;
    };

    const useDispatch = () => {
        const dispatch = useStore(s => s.dispatch);
        if (typeof dispatch !== 'function') {
            console.error(`[TEA][${def.name}] Critical Error: dispatch is not a function in useDispatch() hook.`, { dispatch });
            // Return a fallback no-op function to prevent fatal crash
            return (msg: TMsg) => {
                console.warn(`[TEA][${def.name}] Message dropped: dispatch is missing.`, msg);
            };
        }
        return dispatch;
    };

    return {
        name: def.name,
        Provider,
        useStore,
        useStoreApi,
        useDispatch,
        definition: def
    };
}
