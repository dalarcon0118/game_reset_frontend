// Auth hooks - TEA-based auth functionality for components
import { useAuthStore, selectAuthModel, selectAuthDispatch } from '../store/store';
import { AuthMsgType } from '../store/types';
import { User } from '../../../shared/repositories/auth';
import { RemoteData } from '../../../shared/core/remote.data';

export const useAuth = () => {
    const model = useAuthStore(selectAuthModel);
    const dispatch = useAuthStore(selectAuthDispatch);

    return {
        // State
        user: model.user,
        isAuthenticated: model.isAuthenticated,
        loginResponse: model.loginResponse,
        isLoading: RemoteData.isLoading(model.loginResponse),
        isLoggingOut: model.isLoggingOut,
        error: model.error,
        loginSession: model.loginSession,

        // Actions
        login: (username: string, pin: string) => {
            dispatch({
                type: AuthMsgType.LOGIN_REQUESTED,
                username,
                pin
            });
        },

        logout: () => {
            dispatch({ type: AuthMsgType.LOGOUT_REQUESTED });
        },

        checkLoginStatus: () => {
            dispatch({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED });
        },

        loadSavedUsername: () => {
            dispatch({ type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED });
        },

        updateUsername: (username: string) => {
            dispatch({
                type: AuthMsgType.LOGIN_USERNAME_UPDATED,
                username
            });
        },

        updatePin: (pin: string) => {
            dispatch({
                type: AuthMsgType.LOGIN_PIN_UPDATED,
                pin
            });
        },

        // Computed properties
        hasRole: (role: string): boolean => {
            return model.user?.role === role;
        },

        isListero: () => model.user?.role === 'listero',
        isColector: () => model.user?.role === 'colector',
        isAdmin: () => model.user?.role === 'admin',
    };
};
