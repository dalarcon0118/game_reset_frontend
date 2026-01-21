// Auth update function - pure TEA authentication logic
import { match } from 'ts-pattern';
import { AuthModel, AuthMsg, AuthMsgType } from './types';
import { Cmd, TaskConfig } from '@/shared/core/cmd';
import { LoginService } from '@/shared/services/auth/LoginService';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { TokenService } from '@/shared/services/TokenService';
import { hashString } from '@/shared/utils/crypto';

const loginService = LoginService();

// Pure update function for authentication
export const updateAuth = (model: AuthModel, msg: AuthMsg): [AuthModel, Cmd] => {
    return match(msg)
        .with({ type: AuthMsgType.LOGIN_REQUESTED }, ({ username, pin }) => {
            // Set loading state
            const loadingModel: AuthModel = {
                ...model,
                isLoading: true,
                error: null,
                loginSession: {
                    ...model.loginSession,
                    isSubmitting: true,
                },
            };

            // Return command to perform authentication using RemoteDataHttp.fetch
            return [
                loadingModel,
                RemoteDataHttp.fetch(
                    async () => {
                        const hashedPin = await hashString(pin);
                        return loginService.login(username, hashedPin);
                    },
                    (webData) => ({
                        type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
                        webData
                    })
                ),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGIN_RESPONSE_RECEIVED }, ({ webData }) => {
            return match(webData)
                .with({ type: 'Success' }, ({ data }) => [
                    {
                        ...model,
                        user: data,
                        isAuthenticated: !!data,
                        isLoading: false,
                        error: null,
                        loginSession: {
                            ...model.loginSession,
                            pin: '',
                            isSubmitting: false,
                        },
                    },
                    Cmd.task({
                        task: async () => {
                            // Save last username using TokenService
                            if (data && data.username) {
                                await TokenService.saveLastUsername(data.username);
                            }
                        },
                        onSuccess: () => ({ type: 'NONE' } as any),
                        onFailure: () => ({ type: 'NONE' } as any),
                    }),
                ] as [AuthModel, Cmd])
                .with({ type: 'Failure' }, ({ error }) => {
                    const errorMessage = typeof error === 'string'
                        ? error
                        : (error?.message || 'Error de conexión');

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
                        Cmd.navigate({
                            pathname: '/error',
                            params: { message: errorMessage }
                        }),
                    ] as [AuthModel, Cmd];
                })
                .otherwise(() => [model, Cmd.none] as [AuthModel, Cmd]);
        })

        .with({ type: AuthMsgType.LOGIN_FAILED }, ({ error }) => {
            const errorMessage = typeof error === 'string'
                ? error
                : (error?.message || 'Error de conexión');

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
            return [
                { ...model, isLoading: true },
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
            return match(webData)
                .with({ type: 'Success' }, ({ data }) => [
                    {
                        ...model,
                        user: data,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    },
                    Cmd.none,
                ] as [AuthModel, Cmd])
                .with({ type: 'Failure' }, ({ error }) => {
                    const errorMessage = typeof error === 'string'
                        ? error
                        : (error?.message || 'Sesión no válida');

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
                .otherwise(() => [model, Cmd.none] as [AuthModel, Cmd]);
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_FAILED }, ({ error }) => {
            const errorMessage = typeof error === 'string'
                ? error
                : (error?.message || 'Error de conexión');

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
                Cmd.navigate({ pathname: '/login', method: 'replace' }),
            ] as [AuthModel, Cmd];
        })

        .otherwise(() => [model, Cmd.none] as [AuthModel, Cmd]);
};
