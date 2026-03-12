// Auth update function - pure TEA authentication logic
import { AuthModel, AuthMsg, AuthMsgType } from './types';
import { Cmd, RemoteData, RemoteDataHttp } from '@/shared/core/tea-utils';
import { AuthRepository, AuthErrorType, User, AuthSession } from '@/shared/repositories/auth';
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
            // Reset exit flag in repository when starting login
            AuthRepository.resetExitFlag();
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

// Check auth status command using Repository
const checkAuthStatusCmd = (): Cmd => {
    return Cmd.task(async () => {
        await AuthRepository.hydrate();
    }, 'CHECK_AUTH_STATUS_REPOSITORY');
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
    return match(msg)
        .with({ type: AuthMsgType.SESSION_HYDRATED }, ({ user, tokenState }) => {
            log.debug('Session hydrated from coordinator', { user: user?.username, tokenState });
            const status = user ? 'AUTHENTICATED' : 'ANONYMOUS';
            return [
                {
                    ...model,
                    user,
                    status,
                    error: null
                },
                Cmd.none
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.TOKEN_REFRESH_STARTED }, () => {
            log.debug('Token refresh started');
            return [
                { ...model, status: 'REFRESHING' },
                Cmd.none
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.TOKEN_REFRESHED }, ({ token }) => {
            log.debug('Token refreshed successfully');
            return [
                { ...model, status: 'AUTHENTICATED' },
                Cmd.none
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.SESSION_EXPIRED }, ({ reason }) => {
            // Guard: If we are already logging out, expired or anonymous, do nothing to prevent logout loops
            if (['LOGGING_OUT', 'EXPIRED', 'ANONYMOUS'].includes(model.status)) {
                // Silent debug log to avoid noise during normal logout flow
                log.debug('Ignoring session expired signal (already in exit state)', { reason });
                return [model, Cmd.none] as [AuthModel, Cmd];
            }

            log.warn('Session expired signal received - forcing logout', { reason, currentStatus: model.status });

            return [
                {
                    ...model,
                    user: null,
                    status: 'EXPIRED',
                    error: reason || 'La sesión ha expirado'
                },
                Cmd.batch([
                    logoutCmd(),
                    Cmd.navigate({ pathname: '/login', method: 'replace' })
                ])
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED }, () => {
            return [
                { ...model, status: 'HYDRATING' },
                checkAuthStatusCmd()
            ] as [AuthModel, Cmd];
        })

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
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGIN_RESPONSE_RECEIVED }, ({ webData }) => {
            if (webData.type === 'Success') {
                const user = webData.data.user;
                return [
                    {
                        ...model,
                        user,
                        status: 'AUTHENTICATED',
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
                        status: 'ANONYMOUS',
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
            return [model, Cmd.none] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.USER_CHANGED }, ({ user }) => {
            if (user === null && (model.status === 'AUTHENTICATED' || model.status === 'REFRESHING')) {
                return [
                    {
                        ...model,
                        user: null,
                        status: 'ANONYMOUS',
                        loginResponse: RemoteData.notAsked(),
                    },
                    Cmd.navigate({ pathname: '/login', method: 'replace' })
                ] as [AuthModel, Cmd];
            }

            if (user) {
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
                        pin: '',
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
            if (model.status === 'LOGGING_OUT') return [model, Cmd.none] as [AuthModel, Cmd];

            return [
                { ...model, status: 'LOGGING_OUT' },
                logoutCmd(),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGOUT_RESPONSE_RECEIVED }, ({ webData }) => {
            if (webData.type === 'Success') {
                return [
                    {
                        ...model,
                        user: null,
                        status: 'ANONYMOUS',
                        loginResponse: RemoteData.notAsked(),
                    },
                    Cmd.navigate({ pathname: '/login', method: 'replace' }),
                ] as [AuthModel, Cmd];
            }
            return [
                {
                    ...model,
                    status: 'AUTHENTICATED',
                    error: webData.type === 'Failure' ? webData.error?.message || 'Error al cerrar sesión' : undefined,
                },
                Cmd.none,
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED }, ({ webData }) => {
            if (webData.type === 'Success') {
                const user = webData.data;
                return [
                    {
                        ...model,
                        user,
                        status: user ? 'AUTHENTICATED' : 'ANONYMOUS',
                        error: null
                    },
                    Cmd.none,
                ] as [AuthModel, Cmd];
            }
            return [
                {
                    ...model,
                    status: 'ANONYMOUS',
                    error: webData.type === 'Failure' ? webData.error?.message || 'Error al verificar sesión' : undefined
                },
                Cmd.none,
            ] as [AuthModel, Cmd];
        })
        .with({ type: AuthMsgType.LOGIN_SUCCEEDED }, () => [model, Cmd.none] as [AuthModel, Cmd])
        .with({ type: AuthMsgType.LOGIN_FAILED }, () => [model, Cmd.none] as [AuthModel, Cmd])
        .with({ type: AuthMsgType.LOGOUT_SUCCEEDED }, () => [model, Cmd.none] as [AuthModel, Cmd])
        .with({ type: AuthMsgType.LOGOUT_FAILED }, () => [model, Cmd.none] as [AuthModel, Cmd])
        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_FAILED }, () => [model, Cmd.none] as [AuthModel, Cmd])
        .with({ type: AuthMsgType.ROLE_CHECK_REQUESTED }, () => [model, Cmd.none] as [AuthModel, Cmd])
        .with({ type: AuthMsgType.CONNECTION_STATUS_CHANGED }, () => [model, Cmd.none] as [AuthModel, Cmd])
        .exhaustive();
};
