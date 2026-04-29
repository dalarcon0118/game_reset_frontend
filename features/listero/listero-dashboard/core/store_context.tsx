import React, { ReactNode } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';
import { createTEAModule } from '@core/engine/tea_module';
import { Model } from './model';
import { Msg } from './msg';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { initialState as initial } from './initial.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_LIFECYCLE');
log.info('[DASHBOARD_LIFECYCLE] Module loaded, creating DashboardModule', {
  name: 'ListeroDashboard',
  initialFn: 'function'
});

// ============================================================================
// Module Definition
// ============================================================================

export const DashboardModule = createTEAModule<Model, Msg>({
    name: 'ListeroDashboard',
    initial,
    update,
    subscriptions
});

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
// Provider Component
// ============================================================================

interface ListeroDashboardProviderProps {
    children: ReactNode;
    initialParams?: any;
}

/**
 * ListeroDashboardProvider
 * Wraps the Dashboard with its own TEA store.
 * Uses the standardized DashboardModule.Provider for automatic registration.
 */
export const ListeroDashboardProvider: React.FC<ListeroDashboardProviderProps> = ({ children, initialParams }) => {
    return (
        <DashboardModule.Provider initialParams={initialParams}>
            {children}
        </DashboardModule.Provider>
    );
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the dashboard store within the Provider.
 * Throws an error if used outside the provider.
 */
export function useListeroDashboardStore(): StoreState;
export function useListeroDashboardStore<T>(selector: (state: StoreState) => T): T;
export function useListeroDashboardStore<T>(selector?: (state: StoreState) => T): T | StoreState {
    return DashboardModule.useStore(selector as any) as any;
}

/**
 * Selectors for optimized re-renders
 */
export const selectDashboardModel = (state: StoreState) => state.model;
export const selectDashboardDispatch = (state: StoreState) => state.dispatch;

/**
 * Get the raw Zustand store API.
 * Useful for lifecycle management (cleanup, etc.)
 */
export function useListeroDashboardStoreApi(): StoreType {
    return DashboardModule.useStoreApi() as any;
}
