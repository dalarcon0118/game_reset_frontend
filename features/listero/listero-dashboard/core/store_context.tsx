import React, { createContext, useContext, useMemo, useEffect, ReactNode } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';
import { createElmStore } from '@/shared/core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { initialState as initial } from './initial.types';

// ============================================================================
// Types
// ============================================================================

interface StoreState {
    model: Model;
    dispatch: (msg: Msg) => void;
    cleanup: () => void;
}

type StoreType = UseBoundStore<StoreApi<StoreState>>;

// ============================================================================
// Context
// ============================================================================

const ListeroDashboardContext = createContext<StoreType | undefined>(undefined);

// ============================================================================
// Store Factory
// ============================================================================

const createDashboardStore = () => {
    return createElmStore<Model, Msg>({
        initial,
        update,
        subscriptions
    });
};

// ============================================================================
// Provider Component
// ============================================================================

interface ListeroDashboardProviderProps {
    children: ReactNode;
}

export const ListeroDashboardProvider: React.FC<ListeroDashboardProviderProps> = ({ children }) => {
    const store = useMemo(() => createDashboardStore(), []);

    useEffect(() => {
        return () => {
            // Cleanup subscriptions when the provider unmounts
            store.getState().cleanup();
        };
    }, [store]);

    return (
        <ListeroDashboardContext.Provider value={store}>
            {children}
        </ListeroDashboardContext.Provider>
    );
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the dashboard store within the Provider.
 * Throws an error if used outside the provider.
 * 
 * Usage:
 * - useListeroDashboardStore() - returns full state { model, dispatch, cleanup }
 * - useListeroDashboardStore(state => state.model) - returns selected value
 * - useListeroDashboardStore.getStoreApi() - returns raw Zustand store
 */
export function useListeroDashboardStore(): StoreState;
export function useListeroDashboardStore<T>(selector: (state: StoreState) => T): T;
export function useListeroDashboardStore<T>(selector?: (state: StoreState) => T): T | StoreState {
    const store = useContext(ListeroDashboardContext);
    
    if (!store) {
        throw new Error('useListeroDashboardStore must be used within ListeroDashboardProvider');
    }
    
    // If no selector provided, return full state reactively
    if (!selector) {
        return store();
    }
    
    return store(selector);
}

/**
 * Get the raw Zustand store API.
 * Useful for lifecycle management (cleanup, etc.)
 */
export function useListeroDashboardStoreApi(): StoreType {
    const store = useContext(ListeroDashboardContext);
    
    if (!store) {
        throw new Error('useListeroDashboardStoreApi must be used within ListeroDashboardProvider');
    }
    
    return store;
}

// ============================================================================
// Selectors (for compatibility)
// ============================================================================

export const selectDashboardModel = (state: StoreState) => state.model;
export const selectDashboardDispatch = (state: StoreState) => state.dispatch;
