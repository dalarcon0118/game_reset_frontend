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
 */
export const useAuthV1 = () => {
    const { model, dispatch } = AuthModuleV1.useStore();

    return {
        // Estado
        user: model.user,
        status: model.status,
        isAuthenticated: model.status === AuthStatus.AUTHENTICATED || model.status === AuthStatus.AUTHENTICATED_OFFLINE,
        isAuthenticating: model.status === AuthStatus.AUTHENTICATING || model.status === AuthStatus.REFRESHING,
        isHydrating: model.status === AuthStatus.BOOTSTRAPPING,
        isLoading: model.status === AuthStatus.AUTHENTICATING || model.status === AuthStatus.REFRESHING || model.status === AuthStatus.BOOTSTRAPPING,
        isOffline: model.isOffline,
        error: model.error,

        // Acciones
        login: (username: string, pin: string) => dispatch(LOGIN_REQUESTED({ username, pin })),
        logout: () => dispatch(LOGOUT_REQUESTED()),

        // Utilidades de autorización
        hasRole: (role: string): boolean => model.user?.role === role,

        // Dispatch directo para casos avanzados
        dispatch
    };
};
