import React, { useMemo, useRef, useCallback } from 'react';
import { AuthModuleV1 } from '../adapters/auth_provider';
import { AuthStatus, isSessionHydrated, isFullyAuthenticated } from '@/shared/auth/v1/model';
import {
    LOGIN_REQUESTED,
    LOGOUT_REQUESTED
} from '@/shared/auth/v1/msg';

/**
 * useAuthV1
 * Fachada estable para consumir el estado de autenticación en la UI.
 * Abstrae los detalles de TEA y proporciona una API imperativa/reactiva simple.
 *
 * IMPORTANTE: Usa useMemo para evitar re-renders innecesarios.
 * No retornar nuevos objetos en cada llamada.
 */
export const useAuthV1 = () => {
    const model = AuthModuleV1.useStore(s => s.model);
    const dispatch = AuthModuleV1.useDispatch();

    const dispatchRef = useRef(dispatch);
    dispatchRef.current = dispatch;

    const status = model.status;
    const isAuthenticating = status === AuthStatus.AUTHENTICATING || status === AuthStatus.REFRESHING;

    const login = useCallback((username: string, pin: string) => {
        dispatchRef.current(LOGIN_REQUESTED({ username, pin }));
    }, []);

    const logout = useCallback(() => {
        dispatchRef.current(LOGOUT_REQUESTED());
    }, []);

    const hasRole = useCallback((role: string): boolean => model.user?.role === role, [model.user]);

    return useMemo(() => ({
        user: model.user,
        status: model.status,
        isAuthenticated: isFullyAuthenticated(model),
        isSessionHydrated: isSessionHydrated(model),
        needsPinConfirmation: status === AuthStatus.IDLE,
        isAuthenticating,
        isHydrating: status === AuthStatus.BOOTSTRAPPING,
        isLoading: isAuthenticating || status === AuthStatus.BOOTSTRAPPING,
        isOffline: model.isOffline,
        error: model.error,
        login,
        logout,
        hasRole,
        dispatch: dispatchRef.current
    }), [model.user, status, model.isOffline, model.error, isAuthenticating]);
};
