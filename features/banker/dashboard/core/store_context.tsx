import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';
import { createElmStore, UpdateResult } from '@core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions } from './update';
import { RemoteData, singleton } from '@core/tea-utils';

// Tipo para el estado del store
interface StoreState {
    model: Model;
    dispatch: (msg: Msg) => void;
    init: (params?: any) => void;
    cleanup: () => void;
}

// Tipo para el store de Zustand interno
type StoreType = UseBoundStore<StoreApi<StoreState>>;

// Contexto React
const BankerDashboardContext = createContext<StoreType | undefined>(undefined);

// Función para crear el store (será usada por el Provider)
const createDashboardStore = () => {
    const initialModel = (): UpdateResult<Model, Msg> => {
        const model: Model = {
            agencies: RemoteData.notAsked(),
            summary: RemoteData.notAsked(),
            userStructureId: null,
            selectedAgencyId: null,
        };
        return singleton(model);
    };

    return createElmStore<Model, Msg>({
        initial: initialModel,
        update,
        subscriptions
    });
};

// Provider del Dashboard
export const BankerDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useMemo(() => createDashboardStore(), []);

    useEffect(() => {
        return () => {
            // Cleanup subscriptions when the provider unmounts
            store.getState().cleanup();
        };
    }, [store]);

    return (
        <BankerDashboardContext.Provider value={store}>
            {children}
        </BankerDashboardContext.Provider>
    );
};

/**
 * Hook para usar el store dentro del Provider.
 * Proporciona acceso reactivo al estado (model, dispatch, etc).
 */
export function useDashboardStore(): StoreState;
export function useDashboardStore<T>(selector: (state: StoreState) => T): T;
export function useDashboardStore<T>(selector?: (state: StoreState) => T): T | StoreState {
    const store = useContext(BankerDashboardContext);
    if (!store) {
        throw new Error('useDashboardStore must be used within a BankerDashboardProvider');
    }
    
    // Si no se proporciona un selector, devolvemos el estado completo de forma reactiva
    if (!selector) {
        return store();
    }
    
    return store(selector);
}

// Selectores (para mantener compatibilidad)
export const selectDashboardModel = (state: StoreState) => state.model;
export const selectDashboardDispatch = (state: StoreState) => state.dispatch;