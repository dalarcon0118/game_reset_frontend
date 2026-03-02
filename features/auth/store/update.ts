// Auth update function - pure TEA authentication logic
import { AuthModel, AuthMsg, AuthMsgType } from './types';
import { Cmd } from '../../../shared/core/cmd';
import { RemoteData, WebData } from '../../../shared/core/remote.data';
import { RemoteDataHttp } from '../../../shared/core/remote.data.http';
import { AuthRepository, AuthErrorType, User, AuthSession } from '../../../shared/repositories/auth';
import { logger } from '../../../shared/utils/logger';
import { match } from 'ts-pattern';

const log = logger.withTag('AUTH_UPDATE');

const mapAuthError = (type: AuthErrorType, defaultMessage: string): string => {
    return match(type)
        .with(AuthErrorType.INVALID_CREDENTIALS, () => 'Usuario o PIN incorrectos')
        .with(AuthErrorType.CONNECTION_ERROR, () => 'Error de conexión. Verifica tu conexión a internet.')
        .with(AuthErrorType.SESSION_EXPIRED, () => 'Tu sesión ha expirado.')
        .with(AuthErrorType.SERVER_ERROR, () => 'Error en el servidor. Inténtalo más tarde.')
        .otherwise(() => defaultMessage);
};

// Login command using RemoteDataHttp.fetch
const loginCmd = (username: string, pin: string): Cmd => {
    return RemoteDataHttp.fetch<AuthSession, AuthMsg>(
        async () => {
            const result = await AuthRepository.login(username, pin);
            if (result.success) {
                return result.data;
            } else {
                throw { type: result.error.type, message: result.error.message };
            }
        },
        (webData) => ({
            type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
            webData
        } as AuthMsg),
        'AUTH_LOGIN'
    );
};

// Check auth status command
const checkAuthStatusCmd = (): Cmd => {
    return RemoteDataHttp.fetch<User | null, AuthMsg>(
        async () => {
            const user = await AuthRepository.getUserIdentity();
            return user;
        },
        (webData) => ({
            type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
            webData
        } as AuthMsg),
        'CHECK_AUTH_STATUS'
    );
};

// Logout command
const logoutCmd = (): Cmd => {
    return RemoteDataHttp.fetch<void, AuthMsg>(
        async () => {
            await AuthRepository.logout();
        },
        (webData) => ({
            type: AuthMsgType.LOGOUT_RESPONSE_RECEIVED,
            webData
        } as AuthMsg),
        'AUTH_LOGOUT'
    );
};

// Save last username command
const saveLastUsernameCmd = (username: string): Cmd => {
    return RemoteDataHttp.fetch<void, AuthMsg>(
        async () => {
            await AuthRepository.saveLastUsername(username);
        },
        (webData) => ({
            type: AuthMsgType.SAVED_USERNAME_SAVED,
            webData
        } as AuthMsg),
        'SAVE_USERNAME'
    );
};

// Load saved username command
const loadSavedUsernameCmd = (): Cmd => {
    return RemoteDataHttp.fetch<string | null, AuthMsg>(
        async () => {
            return await AuthRepository.getLastUsername();
        },
        (webData) => ({
            type: AuthMsgType.SAVED_USERNAME_LOADED,
            webData
        } as AuthMsg),
        'LOAD_USERNAME'
    );
};

// Pure update function for authentication
export const updateAuth = (model: AuthModel, msg: AuthMsg): [AuthModel, Cmd] => {
    const result = match(msg)
        .with({ type: AuthMsgType.LOGIN_REQUESTED }, ({ username, pin }) => {
            return [
                {
                    ...model,
                    loginResponse: RemoteData.loading(),
                    error: null,
                    loginSession: {
                        ...model.loginSession,
                        isSubmitting: true,
                    },
                },
                loginCmd(username, pin)
            ];
        })

        .with({ type: AuthMsgType.LOGIN_RESPONSE_RECEIVED }, ({ webData }) => {
            if (webData.type === 'Success') {
                const user = webData.data.user;
                return [
                    {
                        ...model,
                        user,
                        isAuthenticated: true,
                        loginResponse: RemoteData.success(user),
                        error: null,
                        loginSession: {
                            ...model.loginSession,
                            pin: '',
                            isSubmitting: false,
                        },
                    },
                    Cmd.none,
                ] as [AuthModel, Cmd];
            } else if (webData.type === 'Failure') {
                const error = webData.error;
                const errorMessage = mapAuthError(error.type || AuthErrorType.UNKNOWN_ERROR, error.message || 'Error desconocido');
                return [
                    {
                        ...model,
                        user: null,
                        isAuthenticated: false,
                        loginResponse: RemoteData.failure({ message: errorMessage }),
                        error: errorMessage,
                        loginSession: {
                            ...model.loginSession,
                            pin: '',
                            isSubmitting: false,
                        },
                    },
                    Cmd.none,
                ] as [AuthModel, Cmd];
            }
            // Loading state - already set in LOGIN_REQUESTED
            return [model, Cmd.none] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.USER_CHANGED }, ({ user }) => {
            if (user === null && model.isAuthenticated) {
                // Logout forced from repository (e.g. session expired or server invalidation)
                return [
                    {
                        ...model,
                        user: null,
                        isAuthenticated: false,
                        loginResponse: RemoteData.notAsked(),
                    },
                    Cmd.navigate({ pathname: '/login', method: 'replace' })
                ] as [AuthModel, Cmd];
            }

            if (user && model.isAuthenticated) {
                // Background refresh of user data (e.g. network restored)
                return [
                    {
                        ...model,
                        user,
                    },
                    Cmd.none
                ] as [AuthModel, Cmd];
            }

            return [model, Cmd.none] as [AuthModel, Cmd];
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
                username ? saveLastUsernameCmd(username) : Cmd.none,
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED }, () => {
            return [
                model,
                loadSavedUsernameCmd(),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.SAVED_USERNAME_LOADED }, ({ webData }) => {
            if (webData.type === 'Success' && webData.data) {
                return [
                    {
                        ...model,
                        loginSession: {
                            ...model.loginSession,
                            username: webData.data,
                        },
                    },
                    Cmd.none,
                ] as [AuthModel, Cmd];
            }
            return [model, Cmd.none] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.SAVED_USERNAME_SAVED }, () => {
            // No need to do anything, the save was successful
            return [model, Cmd.none] as [AuthModel, Cmd];
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

            return [
                { ...model, isLoggingOut: true },
                logoutCmd(),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGOUT_RESPONSE_RECEIVED }, ({ webData }) => {
            if (webData.type === 'Success') {
                return [
                    {
                        ...model,
                        user: null,
                        isAuthenticated: false,
                        loginResponse: RemoteData.notAsked(),
                        isLoggingOut: false,
                    },
                    Cmd.navigate({ pathname: '/login', method: 'replace' }),
                ] as [AuthModel, Cmd];
            }
            return [
                {
                    ...model,
                    isLoggingOut: false,
                    error: webData.type === 'Failure' ? webData.error?.message || 'Error al cerrar sesión' : undefined,
                },
                Cmd.none,
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED }, () => {
            return [
                model,
                checkAuthStatusCmd(),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED }, ({ webData }) => {
            if (webData.type === 'Success') {
                const user = webData.data;
                if (user) {
                    return [
                        {
                            ...model,
                            user,
                            isAuthenticated: true,
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
                            error: null
                        },
                        Cmd.none,
                    ] as [AuthModel, Cmd];
                }
            }
            // CHECK_AUTH_STATUS_FAILED is handled by webData.type === 'Failure'
            return [
                {
                    ...model,
                    error: webData.type === 'Failure' ? webData.error?.message || 'Error al verificar sesión' : undefined
                },
                Cmd.none,
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.SESSION_EXPIRED }, () => {
            return [
                {
                    ...model,
                    user: null,
                    isAuthenticated: false,
                },
                Cmd.batch([
                    logoutCmd(),
                    Cmd.navigate({ pathname: '/login', method: 'replace' })
                ]),
            ] as [AuthModel, Cmd];
        })

        .otherwise(() => [model, Cmd.none] as [AuthModel, Cmd]);

    return result as [AuthModel, Cmd];
};
