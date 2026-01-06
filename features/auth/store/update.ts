// Auth update function - pure TEA authentication logic
import { match } from 'ts-pattern';
import { AuthModel, AuthMsg, AuthMsgType } from './types';
import { mockUsers } from '../../../data/mockData';
import { Cmd } from '../../../shared/core/cmd';
import type { TaskConfig } from '../../../shared/core/cmd';
import { LoginService } from '../../../shared/services/auth/LoginService';
import apiClient from '../../../shared/services/ApiClient';

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

            // Return command to perform authentication
            return [
                loadingModel,
                Cmd.task({
                    task: loginService.login,
                    args: [username, pin],
                    onSuccess: (user: any) => ({
                        type: AuthMsgType.LOGIN_SUCCEEDED,
                        user
                    } as AuthMsg),
                    onFailure: (error: any) => ({
                        type: AuthMsgType.LOGIN_FAILED,
                        error: error.message || 'Error de conexión'
                    } as AuthMsg)
                }),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGIN_SUCCEEDED }, ({ user }) => {
            return [
                {
                    ...model,
                    user,
                    isAuthenticated: true,
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
                        if (user.username) {
                            await apiClient.saveLastUsername(user.username);
                        }
                    },
                    onSuccess: () => ({ type: 'NONE' } as any),
                    onFailure: () => ({ type: 'NONE' } as any),
                }),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.LOGIN_FAILED }, ({ error }) => {
            return [
                {
                    ...model,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error,
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
                            await apiClient.saveLastUsername(username);
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
                    task: () => apiClient.getLastUsername(),
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

        .with({ type: AuthMsgType.LOGOUT_REQUESTED }, () => {
            const logoutTask: TaskConfig = {
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
                Cmd.task({
                    task: loginService.checkLoginStatus,
                    onSuccess: (user: any) => {
                        if (user) {
                            return { type: AuthMsgType.LOGIN_SUCCEEDED, user } as AuthMsg;
                        } else {
                            return { type: AuthMsgType.SESSION_EXPIRED } as AuthMsg;
                        }
                    },
                    onFailure: (error: any) => ({
                        type: AuthMsgType.CHECK_AUTH_STATUS_FAILED,
                        error: error.message || 'Sesión no válida'
                    } as AuthMsg),
                }),
            ] as [AuthModel, Cmd];
        })

        .with({ type: AuthMsgType.CHECK_AUTH_STATUS_FAILED }, ({ error }) => {
            return [
                {
                    ...model,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error
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
                Cmd.none, // No navigation here to avoid loops, the root layout handles initial state
            ] as [AuthModel, Cmd];
        })

        .otherwise(() => [model, Cmd.none] as [AuthModel, Cmd]);
};
