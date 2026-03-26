import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { createElmStore } from './engine';
import { UseBoundStore, StoreApi } from 'zustand';
import { storeRegistry } from './store_registry';

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
                initial: def.initial,
                update: def.update,
                subscriptions: def.subscriptions || (() => null),
                effectHandlers: def.effectHandlers,
                middlewares: def.middlewares,
                name: def.name
            });

            if (initialParams !== undefined) {
                store.getState().init(initialParams);
            }

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
        return store(selector as any) as T;
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

    const useDispatch = () => useStore(s => s.dispatch);

    return {
        name: def.name,
        Provider,
        useStore,
        useStoreApi,
        useDispatch,
        definition: def
    };
}
