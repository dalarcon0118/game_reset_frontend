import { AuthModuleV1 } from '../adapters/auth_provider';
import { AuthStatus } from '@/shared/auth/v1/model';

/**
 * useAuthV1
 * Fachada estable para consumir el estado de autenticación en la UI.
 * Abstrae los detalles de TEA y proporciona una API imperativa/reactiva simple.
 */
export const useAuthV1 = () => {
    const { model, dispatch } = AuthModuleV1.useStore();

    return {
        // Estado
        user: model.user,
        status: model.status,
        isAuthenticated: model.status === AuthStatus.AUTHENTICATED || model.status === AuthStatus.AUTHENTICATED_OFFLINE,
        isAuthenticating: model.status === AuthStatus.BOOTSTRAPPING || model.status === AuthStatus.REFRESHING,
        isOffline: model.isOffline,
        error: model.error,
        loginSession: model.loginSession,

        // Acciones
        bootstrap: () => dispatch({ type: 'BOOTSTRAP_STARTED' }),
        login: (username: string, pin: string) => dispatch({ type: 'LOGIN_REQUESTED', username, pin }),
        logout: () => dispatch({ type: 'LOGOUT_REQUESTED' }),

        updateUsername: (username: string) => dispatch({ type: 'LOGIN_USERNAME_UPDATED', username }),
        updatePin: (pin: string) => dispatch({ type: 'LOGIN_PIN_UPDATED', pin }),

        // Utilidades de autorización
        hasRole: (role: string): boolean => model.user?.role === role,

        // Dispatch directo para casos avanzados
        dispatch
    };
};
