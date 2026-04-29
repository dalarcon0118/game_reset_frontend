import React, { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { createElmStore, UpdateResult } from './engine';
import { UseBoundStore, StoreApi } from 'zustand';
import { storeRegistry } from './store_registry';
import { Cmd } from '../tea-utils';
import { debugTeaModule, debugEngine } from './debug_tea';

/**
 * Store Validation Helper
 * Type guard to check if a value is a valid Zustand store.
 */
function isValidZustandStore(value: unknown): value is UseBoundStore<StoreApi<any>> {
    // Check that value is a function (callable)
    if (typeof value !== 'function') {
        return false;
    }
    
    // Check that it has getState method
    if (typeof (value as any).getState !== 'function') {
        return false;
    }
    
    // Check that it has subscribe method
    if (typeof (value as any).subscribe !== 'function') {
        return false;
    }
    
    return true;
}

/**
 * TEA Module Definition
 * Pure data structure describing a TEA module without instantiating it.
 */
export interface TeaModuleDef<TModel, TMsg> {
    name: string;
    initial: (params?: any) => UpdateResult<TModel, TMsg>;
    update: (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>;
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
        const renderCount = useRef(0);
        renderCount.current++;

        debugTeaModule('Provider render', { 
            name: def.name, 
            renderCount: renderCount.current,
            hasStore: !!storeRef.current,
            hasProvidedStore: !!providedStore 
        });

        if (!storeRef.current) {
            debugTeaModule('Creating new store', { name: def.name });
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
            debugTeaModule('Store created and registered', { name: def.name });
        }

        const store = storeRef.current as any;

        useEffect(() => {
            debugTeaModule('Provider mounted', { name: def.name });
            return () => {
                debugTeaModule('Provider unmounting', { name: def.name, hasProvidedStore: !!providedStore });
                if (!providedStore) {
                    store?.getState().cleanup?.();
                    storeRegistry.unregister(def.name);
                    debugTeaModule('Store cleaned up', { name: def.name });
                }
            };
        }, [store, providedStore]);

        return <Context.Provider value={store as any}>{children}</Context.Provider>;
    };

    const useStore = <T = { model: TModel; dispatch: (msg: TMsg) => void }>(
        selector?: (state: { model: TModel; dispatch: (msg: TMsg) => void }) => T
    ): T => {
        const store = useContext(Context);
        const callCount = useRef(0);
        const lastRenderTime = useRef<number>(0);
        const renderCountByStore = useRef<number>(0);
        
        callCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        // Validate store is not null/undefined
        if (!store) {
            throw new Error(
                `TEA Architecture Violation: ${def.name}Store accessed without its Provider. ` +
                `Wrap your component tree with <${def.name}Module.Provider />.`
            );
        }
        
        // Validate store is a valid Zustand store
        if (!isValidZustandStore(store)) {
            throw new Error(
                `TEA Architecture Violation: ${def.name}Store context is misconfigured. ` +
                `The Context value is not a valid Zustand store. ` +
                `Expected a store with getState() and subscribe() methods. ` +
                `Wrap your component tree with <${def.name}Module.Provider />.`
            );
        }
        
        // AUDIT: Detectar renders rápidos que indican loop
        const isRapidRender = timeSinceLastRender < 50 && callCount.current > 5;
        
        debugTeaModule(`useStore call #${callCount.current}`, { 
            name: def.name,
            hasSelector: !!selector,
            timeSinceLastRender,
            isRapidRender,
            callCount: callCount.current
        });

        // GUARD: Detener loop si hay más de 50 renders en menos de 1 segundo
        if (timeSinceLastRender < 20 && callCount.current > 50) {
            console.error(`[TEA][${def.name}] RENDER LOOP DETECTED: ${callCount.current} renders in rapid succession`);
            console.error(`[TEA][${def.name}] Time since last render: ${timeSinceLastRender}ms`);
            console.error(`[TEA][${def.name}] Selector: ${selector?.toString()?.substring(0, 200)}`);
            debugTeaModule('RENDER_LOOP_DETECTED', { 
                callCount: callCount.current, 
                timeSinceLastRender,
                selector: selector?.toString()?.substring(0, 200)
            });
            // Retornar estado actual sin causar más re-renders
            return store.getState() as T;
        }

        // Usar Zustand nativo que internamente usa useSyncExternalStore
        // Esto suscribe correctamente al store y solo causa re-renders cuando cambia el estado
        try {
            const result = selector ? store(selector as any) as T : store();
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(
                `TEA Architecture Error: ${def.name}Store access failed. ` +
                `Error during store call: ${errorMessage}. ` +
                `This may indicate the Provider is misconfigured or the store is corrupted.`
            );
        }

        debugTeaModule(`useStore result #${callCount.current}`, { 
            name: def.name,
            resultType: typeof result,
            hasModel: result && typeof result === 'object' && 'model' in result
        });

        return result;
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
