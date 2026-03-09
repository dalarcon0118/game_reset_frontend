import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { createElmStore, ElmStoreConfig } from './engine';
import { UseBoundStore, StoreApi } from 'zustand';

/**
 * TEA Module Definition
 * Pure data structure describing a TEA module without instantiating it.
 */
export interface TeaModuleDef<TModel, TMsg> extends ElmStoreConfig<TModel, TMsg> {
    name: string;
}

/**
 * TEA Module Instance
 * Result of createTEAModule, containing the Provider and hooks.
 */
export interface TeaModuleInstance<TModel, TMsg> {
    name: string;
    Provider: React.FC<{ children: ReactNode }>;
    useStore: <T = { model: TModel; dispatch: (msg: TMsg) => void }>(
        selector?: (state: { model: TModel; dispatch: (msg: TMsg) => void }) => T
    ) => T;
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

    const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
        // The store is created ONLY when the Provider is mounted.
        // It's also cleaned up automatically when unmounted if the engine supports it.
        const store = useMemo(() => createElmStore(def), []);

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

    const useDispatch = () => useStore(s => s.dispatch);

    return {
        name: def.name,
        Provider,
        useStore,
        useDispatch,
        definition: def
    };
}
