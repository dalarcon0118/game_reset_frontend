// Auth update function - pure TEA authentication logic
import { match, P } from 'ts-pattern';
import { AuthModel, AuthMsg, AuthMsgType, User } from './types';
import { Cmd } from '@/shared/core/cmd';
import { LoginService } from '@/shared/services/auth/login_service';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { TokenService } from '@/shared/services/token_service';
import { hashString } from '@/shared/utils/crypto';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('AUTH_UPDATE');
const loginService = LoginService();

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

            // Return command to perform authentication with offline support
            return [
                loadingModel,
                Cmd.task({
                    task: async () => {
                        const hashedPin = await hashString(pin);

                        try {
                            log.info('Attempting online login', { username });
                            // 1. Intentar login online
                            // FIX: Enviar PIN en texto plano (el backend de Django lo hashea internamente)
                            // El hashedPin se usa SOLO para validación offline futura
                            const user = await loginService.login(username, pin);
                            log.info('Online login successful', { username });
                            return {
                                type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
                                webData: { type: 'Success', data: user } as const,
                                hashedPin // Pasamos el hash para persistirlo si el login fue exitoso
                            };
                        } catch (error: any) {
                            const errorMsg = error.message || '';
                            log.warn('Online login failed', { username, error: errorMsg });

                            // 2. Si es un error de red, intentar login offline
                            if (errorMsg.toLowerCase().includes('network request failed') ||
                                errorMsg.toLowerCase().includes('failed to fetch') ||
                                errorMsg.toLowerCase().includes('timeout') ||
                                errorMsg.toLowerCase().includes('aborted')) {

                                log.info('Server unavailable, attempting offline authentication', { username });

                                const lastUser = await TokenService.getLastUsername();
                                const savedHash = await TokenService.getUserPinHash();
                                const savedProfile = await TokenService.getUserProfile();

                                if (username === lastUser && hashedPin === savedHash && savedProfile) {
                                    log.info('Offline authentication successful');
                                    return {
                                        type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
                                        webData: { type: 'Success', data: savedProfile } as const,
                                        isOffline: true
                                    };
                                }
                            }

                            // 3. Si no es error de red o falló validación local
                            return {
                                type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
                                webData: { type: 'Failure', error } as const
                            };
                        }
                    },
                    onSuccess: (msg) => msg as any,
                    onFailure: (error) => ({
                        type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
                        webData: { type: 'Failure', error: { message: String(error) } } as const
                    } as any)
                })
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGIN_RESPONSE_RECEIVED }, (msg: any) => {
            const { webData, isOffline = false, hashedPin } = msg;

            if (webData.type === 'Success') {
                const data = webData.data;
                return [
                    {
                        ...model,
                        user: data,
                        isAuthenticated: !!data,
                        isLoading: false,
                        isOffline: isOffline,
                        error: null,
                        loginSession: {
                            ...model.loginSession,
                            pin: '',
                            isSubmitting: false,
                        },
                    },
                    Cmd.task({
                        task: async () => {
                            // Persistence logic
                            if (data && data.username && !isOffline) {
                                await TokenService.saveLastUsername(data.username);
                                await TokenService.saveUserProfile(data);
                                if (hashedPin) {
                                    await TokenService.saveUserPinHash(hashedPin);
                                }
                            }
                        },
                        onSuccess: () => ({ type: 'NONE' } as any),
                        onFailure: () => ({ type: 'NONE' } as any),
                    }),
                ] as [AuthModel, Cmd];
            }

            if (webData.type === 'Failure') {
                const error = webData.error;
                let errorMessage = typeof error === 'string'
                    ? error
                    : (error?.message || error?.detail || 'Error de conexión');

                // Localize common technical errors
                if (errorMessage.toLowerCase().includes('network request failed')) {
                    errorMessage = 'No se pudo conectar con el servidor. Revisa tu internet.';
                } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('credentials')) {
                    errorMessage = 'Usuario o PIN incorrectos.';
                }

                return [
                    {
                        ...model,
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        isOffline: false,
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

        .with({ type: AuthMsgType.LOGIN_FAILED }, ({ error }) => {
            let errorMessage = error || 'Error de conexión';

            if (errorMessage.toLowerCase().includes('network request failed')) {
                errorMessage = 'No se pudo conectar con el servidor. Revisa tu internet.';
            } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('credentials')) {
                errorMessage = 'Usuario o PIN incorrectos.';
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
                    task: () => TokenService.getLastUsername(),
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
                task: async () => await loginService.logout(),
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
            // Only set loading if we are not already authenticated
            // This prevents the "blink" or loading screen during background checks
            return [
                { ...model, isLoading: !model.isAuthenticated },
                RemoteDataHttp.fetch(
                    () => loginService.checkLoginStatus(),
                    (webData) => ({
                        type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
                        webData
                    })
                ),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED }, ({ webData }) => {
            log.info('CHECK_AUTH_STATUS_RESPONSE_RECEIVED received', { type: webData.type });
            return match(webData)
                .with({ type: 'Success' }, ({ data }) => [
                    {
                        ...model,
                        user: data,
                        isAuthenticated: !!data,
                        isLoading: false,
                        isOffline: false, // Confirmamos que ya no estamos offline
                        error: null,
                    },
                    Cmd.task({
                        task: async () => {
                            if (data) {
                                await TokenService.saveUserProfile(data);
                            }
                        },
                        onSuccess: () => ({ type: 'NONE' } as any),
                        onFailure: () => ({ type: 'NONE' } as any),
                    })
                ] as [AuthModel, Cmd])
                .with({ type: 'Failure' }, ({ error }) => {
                    const errorMessage = typeof error === 'string'
                        ? error
                        : (error?.message || error?.detail || 'Sesión no válida');

                    // If authentication failed due to token expiration or invalidity, trigger session expired
                    // 401: Unauthorized, 403: Forbidden (often used for deactivated users)
                    if (error?.status === 401 || error?.status === 403) {
                        log.warn('Authentication failed during background sync, logging out', { status: error.status });
                        return [
                            {
                                ...model,
                                user: null,
                                isAuthenticated: false,
                                isLoading: false,
                                isOffline: false,
                                error: 'Su sesión ha expirado o su cuenta ha sido desactivada.'
                            },
                            Cmd.batch([
                                Cmd.task({
                                    task: async () => await TokenService.clearAll(),
                                    onSuccess: () => ({ type: 'NONE' } as any),
                                    onFailure: () => ({ type: 'NONE' } as any),
                                }),
                                Cmd.navigate({ pathname: '/login', method: 'replace' }),
                                Cmd.alert({
                                    title: 'Sesión no válida',
                                    message: 'Su sesión ha expirado o su cuenta ha sido desactivada. Por favor inicie sesión nuevamente.',
                                    buttons: [{ text: 'OK' }]
                                })
                            ])
                        ] as [AuthModel, Cmd];
                    }

                    // Si es un error de red durante el sync, ignoramos y seguimos en offline
                    return [
                        {
                            ...model,
                            isLoading: false,
                        },
                        Cmd.none
                    ] as [AuthModel, Cmd];
                })
                .otherwise(() => [model, Cmd.none] as [AuthModel, Cmd]);
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_FAILED }, ({ error }) => {
            const errorMessage = error || 'Error de conexión';

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
                            const user = await loginService.checkLoginStatus();
                            return {
                                type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
                                webData: { type: 'Success', data: user } as const
                            };
                        },
                        onSuccess: (msg) => msg as any,
                        onFailure: (error: any) => ({
                            type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
                            webData: { type: 'Failure', error } as const
                        } as any)
                    })
                ] as [AuthModel, Cmd];
            }

            return [model, Cmd.none] as [AuthModel, Cmd];
        })

        .otherwise(() => [model, Cmd.none] as [AuthModel, Cmd]);
};
