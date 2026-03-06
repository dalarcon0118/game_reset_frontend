import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { createElmStore } from '@/shared/core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions } from './update';
import { RemoteData, effectHandlers } from '@/shared/core/tea-utils';

// Tipo para el store de Zustand interno
type StoreType = ReturnType<typeof createElmStore<Model, Msg>>;

// Contexto React
const ColectorDashboardContext = createContext<StoreType | undefined>(undefined);

// Función para crear el store (será usada por el Provider)
const createDashboardStore = () => {
    const initialModel: Model = {
        children: RemoteData.notAsked(),
        stats: RemoteData.notAsked(),
        currentDate: '',
        userStructureId: null,
        showBalance: true,
        user: null,
    };

    return createElmStore<Model, Msg>({
        initial: initialModel,
        update,
        subscriptions
    });
};

// Provider del Dashboard
export const ColectorDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useMemo(() => createDashboardStore(), []);

    useEffect(() => {
        return () => {
            // Cleanup subscriptions when the provider unmounts
            store.getState().cleanup();
        };
    }, [store]);

    return (
        <ColectorDashboardContext.Provider value={store}>
            {children}
        </ColectorDashboardContext.Provider>
    );
};

// Hook para usar el store dentro del Provider
export function useDashboardStore<T>(selector?: (state: any) => T): T {
    const store = useContext(ColectorDashboardContext);
    if (!store) {
        throw new Error('useDashboardStore must be used within a ColectorDashboardProvider');
    }
    // Si no se proporciona un selector, devolveremos el estado completo del store
    return store(selector || ((state: any) => state));
}

// Selectores (para mantener compatibilidad)
export const selectDashboardModel = (state: any) => state.model;
export const selectDashboardDispatch = (state: any) => state.dispatch;