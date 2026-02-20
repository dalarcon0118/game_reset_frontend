// Auth update function - pure TEA authentication logic
import { match, P } from 'ts-pattern';
import { AuthModel, AuthMsg, AuthMsgType, User } from './types';
import { Cmd } from '../../../shared/core/cmd';
import { AppKernel } from '../../../shared/core/architecture/kernel';
import { TokenService } from '../../../shared/services/token_service';
import { logger } from '../../../shared/utils/logger';

const log = logger.withTag('AUTH_UPDATE');

// Pure update function for authentication
export const updateAuth = (model: AuthModel, msg: AuthMsg): [AuthModel, Cmd] => {
    return match(msg)
        .with({ type: AuthMsgType.LOGIN_REQUESTED }, ({ username, pin }) => {
            // Set loading state
            const loadingModel: AuthModel = {
                ...model,
                isLoading: true,
                isOffline: false,
                error: null,
                loginSession: {
                    ...model.loginSession,
                    isSubmitting: true,
                },
            };

            // Return command to perform authentication via Adapter
            return [
                loadingModel,
                Cmd.task({
                    task: async () => {
                        log.info('Delegating login to AuthProvider', { username });
                        const result = await AppKernel.authProvider.login({ username, pin });

                        if (result.success) {
                            return {
                                type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
                                user: result.data,
                                isOffline: result.data.isOffline
                            };
                        } else {
                            return {
                                type: AuthMsgType.LOGIN_FAILED,
                                error: result.error.message
                            };
                        }
                    },
                    onSuccess: (msg) => msg as any,
                    onFailure: (error) => ({
                        type: AuthMsgType.LOGIN_FAILED,
                        error: String(error)
                    } as any)
                })
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGIN_RESPONSE_RECEIVED }, (payload: any) => {
            // Adapt to payload structure (might be user or webData depending on legacy types, forcing user here based on task above)
            const user = payload.user || payload.webData?.data;
            const isOffline = payload.isOffline || false;

            if (user) {
                return [
                    {
                        ...model,
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        isOffline: isOffline,
                        error: null,
                        loginSession: {
                            ...model.loginSession,
                            pin: '',
                            isSubmitting: false,
                        },
                    },
                    Cmd.none,
                ] as [AuthModel, Cmd];
            } else {
                // Should ideally not happen if flow is correct, but handling as fallback
                return [
                    {
                        ...model,
                        isLoading: false,
                        error: 'Error de autenticación desconocido',
                    },
                    Cmd.none
                ] as [AuthModel, Cmd];
            }
        })

        .with({ type: AuthMsgType.LOGIN_FAILED }, ({ error }) => {
            // Mejorar mensajes de error según el tipo
            let errorMessage = 'Error de autenticación';

            if (error?.includes('ValidationError') || error?.includes('validación')) {
                errorMessage = 'Error de validación en el servidor. Por favor, intenta nuevamente.';
            } else if (error?.includes('Network') || error?.includes('red')) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
            } else if (error?.includes('Credenciales') || error?.includes('inválidas')) {
                errorMessage = 'Usuario o PIN incorrectos';
            } else if (error) {
                errorMessage = error;
            }

            return [
                {
                    ...model,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: errorMessage,
                    loginSession: {
                        ...model.loginSession,
                        pin: '',
                        isSubmitting: false,
                    },
                },
                Cmd.none,
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGIN_PIN_UPDATED }, ({ pin }) => {
            return [
                {
                    ...model,
                    loginSession: {
                        ...model.loginSession,
                        pin,
                    },
                },
                Cmd.none,
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGIN_USERNAME_UPDATED }, ({ username }) => {
            return [
                {
                    ...model,
                    loginSession: {
                        ...model.loginSession,
                        username,
                        pin: '', // Reset PIN when username changes
                    },
                },
                Cmd.task({
                    task: async () => {
                        if (username) {
                            await TokenService.saveLastUsername(username);
                        }
                    },
                    onSuccess: () => ({ type: 'NONE' } as any),
                    onFailure: () => ({ type: 'NONE' } as any),
                }),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED }, () => {
            return [
                model,
                Cmd.task({
                    task: async () => await TokenService.getLastUsername(),
                    onSuccess: (username: string | null) => ({
                        type: AuthMsgType.SAVED_USERNAME_LOADED,
                        username
                    } as AuthMsg),
                    onFailure: () => ({
                        type: AuthMsgType.SAVED_USERNAME_LOADED,
                        username: null
                    } as AuthMsg),
                }),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.SAVED_USERNAME_LOADED }, ({ username }) => {
            if (!username) return [model, Cmd.none] as [AuthModel, Cmd];

            return [
                {
                    ...model,
                    loginSession: {
                        ...model.loginSession,
                        username,
                    },
                },
                Cmd.none,
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.FORGOT_PIN_REQUESTED }, () => {
            return [
                model,
                Cmd.alert({
                    title: 'Info',
                    message: 'Contacte al administrador para restablecer su PIN',
                    buttons: [{ text: 'OK' }]
                })
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGOUT_REQUESTED }, () => {
            if (model.isLoggingOut) return [model, Cmd.none] as [AuthModel, Cmd];

            const logoutTask = {
                task: async () => await AppKernel.authProvider.logout(),
                onSuccess: () => ({ type: AuthMsgType.LOGOUT_SUCCEEDED } as AuthMsg),
                onFailure: (error: any) => ({
                    type: AuthMsgType.LOGOUT_FAILED,
                    error: error.message || 'Error al cerrar sesión'
                } as AuthMsg)
            };
            return [
                { ...model, isLoggingOut: true },
                Cmd.task(logoutTask),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGOUT_SUCCEEDED }, () => {
            return [
                {
                    ...model,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isLoggingOut: false,
                },
                Cmd.navigate({ pathname: '/login', method: 'replace' }),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGOUT_FAILED }, ({ error }) => {
            return [
                {
                    ...model,
                    isLoggingOut: false,
                    error,
                },
                Cmd.none,
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED }, () => {
            return [
                model,
                Cmd.task({
                    task: async () => {
                        const user = await AppKernel.authProvider.getUserIdentity();
                        return {
                            type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
                            user
                        } as AuthMsg;
                    },
                    onSuccess: (msg) => msg,
                    onFailure: (error) => ({
                        type: AuthMsgType.CHECK_AUTH_STATUS_FAILED,
                        error: error.message
                    } as AuthMsg)
                }),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED }, ({ user }) => {
            if (user) {
                return [
                    {
                        ...model,
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        isOffline: false,
                        error: null
                    },
                    Cmd.none,
                ] as [AuthModel, Cmd];
            } else {
                return [
                    {
                        ...model,
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        isOffline: false,
                        error: null
                    },
                    Cmd.none,
                ] as [AuthModel, Cmd];
            }
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_FAILED }, ({ error }) => {
            const errorMessage = error || 'Error de conexión';

            // Only logout on 401/403 (token invalid), not on network errors
            const isAuthError = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized');
            const isNetworkError = errorMessage.includes('Network') || errorMessage.includes('timeout') || errorMessage.includes('AbortError');

            if (isAuthError) {
                // Token invalid: logout
                return [
                    {
                        ...model,
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: errorMessage
                    },
                    Cmd.none
                ] as [AuthModel, Cmd];
            } else if (isNetworkError) {
                // Network issue: stay authenticated but mark as offline
                return [
                    {
                        ...model,
                        isLoading: false,
                        isOffline: true,
                        error: errorMessage
                    },
                    Cmd.none
                ] as [AuthModel, Cmd];
            } else {
                // Other errors: stay authenticated, no offline flag
                return [
                    {
                        ...model,
                        isLoading: false,
                        error: errorMessage
                    },
                    Cmd.none
                ] as [AuthModel, Cmd];
            }
        })

        .with({ type: AuthMsgType.SESSION_EXPIRED }, () => {
            return [
                {
                    ...model,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                },
                Cmd.batch([
                    Cmd.task({
                        task: async () => await TokenService.clearAll(),
                        onSuccess: () => ({ type: 'NONE' } as any),
                        onFailure: () => ({ type: 'NONE' } as any),
                    }),
                    Cmd.navigate({ pathname: '/login', method: 'replace' })
                ]),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CONNECTION_STATUS_CHANGED }, ({ isOnline }) => {
            log.info('Connection status changed message received', { isOnline, modelIsOffline: model.isOffline, isAuthenticated: model.isAuthenticated });

            // Si volvemos a estar online y estábamos en modo offline, disparamos validación
            if (isOnline && model.isAuthenticated && model.isOffline) {
                log.info('Network restored, triggering background session validation');
                return [
                    model,
                    Cmd.task({
                        task: async () => {
                            const user = await AppKernel.authProvider.getUserIdentity();
                            return {
                                type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
                                user
                            } as AuthMsg;
                        },
                        onSuccess: (msg) => msg as any,
                        onFailure: (error: any) => ({
                            type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
                            user: null // If validation fails, user becomes null
                        } as any)
                    })
                ] as [AuthModel, Cmd];
            }

            return [model, Cmd.none] as [AuthModel, Cmd];
        })

        .otherwise(() => [model, Cmd.none] as [AuthModel, Cmd]);
};
