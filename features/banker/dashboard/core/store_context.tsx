import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { createElmStore } from '@/shared/core/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions } from './update';
import { RemoteData } from '@/shared/core/remote.data';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';

// Tipo para el store de Zustand interno
type StoreType = ReturnType<typeof createElmStore<Model, Msg>>;

// Contexto React
const BankerDashboardContext = createContext<StoreType | undefined>(undefined);

// Función para crear el store (será usada por el Provider)
const createDashboardStore = () => {
    const initialModel: Model = {
        agencies: RemoteData.notAsked(),
        summary: RemoteData.notAsked(),
        userStructureId: null,
        selectedAgencyId: null,
    };

    return createElmStore<Model, Msg>(
        initialModel,
        update,
        effectHandlers as any,
        subscriptions,
        [createLoggerMiddleware()]
    );
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

// Hook para usar el store dentro del Provider
export function useDashboardStore<T>(selector?: (state: any) => T): T {
    const store = useContext(BankerDashboardContext);
    if (!store) {
        throw new Error('useDashboardStore must be used within a BankerDashboardProvider');
    }
    // Si no se proporciona un selector, devolveremos el estado completo del store
    return store(selector || ((state: any) => state));
}

// Selectores (para mantener compatibilidad)
export const selectDashboardModel = (state: any) => state.model;
export const selectDashboardDispatch = (state: any) => state.dispatch;