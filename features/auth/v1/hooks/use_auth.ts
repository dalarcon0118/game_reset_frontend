import React from 'react';
import { AuthModuleV1 } from '../adapters/auth_provider';
import { AuthStatus } from '@/shared/auth/v1/model';
import {
    LOGIN_REQUESTED,
    LOGOUT_REQUESTED
} from '@/shared/auth/v1/msg';

/**
 * useAuthV1
 * Fachada estable para consumir el estado de autenticación en la UI.
 * Abstrae los detalles de TEA y proporciona una API imperativa/reactiva simple.
 *
 * ⚠️ IMPORTANTE: Usa useMemo para evitar re-renders innecesarios.
 * No retornar nuevos objetos en cada llamada.
 */
export const useAuthV1 = () => {
    const { model, dispatch } = AuthModuleV1.useStore();

    // Memoizar valores derivados para evitar re-renders
    const isAuthenticated = model.status === AuthStatus.AUTHENTICATED || model.status === AuthStatus.AUTHENTICATED_OFFLINE;
    const isAuthenticating = model.status === AuthStatus.AUTHENTICATING || model.status === AuthStatus.REFRESHING;
    const isHydrating = model.status === AuthStatus.BOOTSTRAPPING;
    const isLoading = model.status === AuthStatus.AUTHENTICATING || model.status === AuthStatus.REFRESHING || model.status === AuthStatus.BOOTSTRAPPING;

    return React.useMemo(() => ({
        // Estado
        user: model.user,
        status: model.status,
        isAuthenticated,
        isAuthenticating,
        isHydrating,
        isLoading,
        isOffline: model.isOffline,
        error: model.error,

        // Acciones
        login: (username: string, pin: string) => dispatch(LOGIN_REQUESTED({ username, pin })),
        logout: () => dispatch(LOGOUT_REQUESTED()),

        // Utilidades de autorización
        hasRole: (role: string): boolean => model.user?.role === role,

        // Dispatch directo para casos avanzados
        dispatch
    }), [model.user, model.status, model.isOffline, model.error, dispatch, isAuthenticated, isAuthenticating, isHydrating, isLoading]);
};
