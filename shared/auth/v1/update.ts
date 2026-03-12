import { AuthModel, AuthStatus, Tokens } from './model';
import { AuthMsg } from './msg';
import { Return, singleton, ret } from '../../core/tea-utils/return';
import { Cmd } from '../../core/tea-utils/cmd';
import { RemoteDataHttp } from '../../core/tea-utils/remote.data.http';
import { AuthRepository } from '../../repositories/auth';

/**
 * Update Function (v1)
 * 
 * Orquestador reactivo de la sesión. 
 * El SSOT es el AuthRepository; este update solo proyecta el estado.
 */
export function update(model: AuthModel, msg: AuthMsg): Return<AuthModel, AuthMsg> {
    switch (msg.type) {
        case 'BOOTSTRAP_STARTED':
            return ret(
                { ...model, status: AuthStatus.BOOTSTRAPPING },
                RemoteDataHttp.fetch(
                    async () => {
                        const user = await AuthRepository.hydrate();
                        const { access, refresh } = await AuthRepository.getToken();
                        return { access, refresh, user };
                    },
                    (result) => {
                        if (result.type === 'Success' && result.data.user && result.data.access) {
                            return {
                                type: 'SESSION_HYDRATED',
                                user: result.data.user,
                                tokens: { access: result.data.access, refresh: result.data.refresh || undefined },
                                isOffline: false // Inicia asumiendo online
                            };
                        }
                        return {
                            type: 'SESSION_HYDRATED',
                            user: null,
                            tokens: null,
                            isOffline: false
                        };
                    },
                    'AUTH_BOOTSTRAP'
                )
            );

        case 'SESSION_HYDRATED':
            if (msg.tokens) {
                return singleton({
                    ...model,
                    status: AuthStatus.AUTHENTICATED,
                    user: msg.user,
                    tokens: msg.tokens,
                    isOffline: msg.isOffline
                });
            }
            return singleton({
                ...model,
                status: AuthStatus.UNAUTHENTICATED,
                user: null,
                tokens: null
            });

        case 'SESSION_CHANGED':
            // Reacción directa a cambios en el repositorio (SSOT)
            if (msg.user) {
                return singleton({
                    ...model,
                    status: msg.isOffline ? AuthStatus.AUTHENTICATED_OFFLINE : AuthStatus.AUTHENTICATED,
                    user: msg.user,
                    isOffline: msg.isOffline
                });
            }
            return singleton({
                ...model,
                status: AuthStatus.UNAUTHENTICATED,
                user: null,
                tokens: null
            });

        case 'LOGIN_REQUESTED':
            return ret(
                { ...model, status: AuthStatus.BOOTSTRAPPING, error: null },
                RemoteDataHttp.fetch(
                    () => AuthRepository.login(msg.username, msg.pin),
                    (result) => {
                        if (result.type === 'Success') {
                            if (result.data.success) {
                                return {
                                    type: 'LOGIN_SUCCEEDED',
                                    user: result.data.data.user,
                                    tokens: {
                                        access: result.data.data.accessToken,
                                        refresh: result.data.data.refreshToken
                                    },
                                    isOffline: result.data.data.isOffline
                                };
                            }
                            return { type: 'LOGIN_FAILED', error: result.data.error.message };
                        }
                        return { type: 'LOGIN_FAILED', error: 'Error de conexión' };
                    },
                    'AUTH_LOGIN'
                )
            );

        case 'LOGIN_SUCCEEDED':
            // El repositorio ya guardó la sesión, v1 solo actualiza el estado local
            return singleton({
                ...model,
                status: msg.isOffline ? AuthStatus.AUTHENTICATED_OFFLINE : AuthStatus.AUTHENTICATED,
                user: msg.user,
                tokens: msg.tokens,
                isOffline: msg.isOffline,
                error: null,
                loginSession: { ...model.loginSession, pin: '' } // Limpiar PIN al entrar
            });

        case 'LOGIN_FAILED':
            return singleton({
                ...model,
                status: AuthStatus.UNAUTHENTICATED,
                error: msg.error,
                loginSession: { ...model.loginSession, pin: '' } // Limpiar PIN al fallar
            });

        case 'LOGIN_USERNAME_UPDATED':
            return singleton({
                ...model,
                loginSession: { ...model.loginSession, username: msg.username }
            });

        case 'LOGIN_PIN_UPDATED':
            return singleton({
                ...model,
                loginSession: { ...model.loginSession, pin: msg.pin }
            });

        case 'LOGOUT_REQUESTED':
            return ret(
                { ...model, status: AuthStatus.LOGGING_OUT },
                RemoteDataHttp.fetch(
                    () => AuthRepository.logout(),
                    () => ({ type: 'LOGOUT_COMPLETED' }),
                    'AUTH_LOGOUT'
                )
            );

        case 'LOGOUT_COMPLETED':
            return ret(
                { ...model, status: AuthStatus.UNAUTHENTICATED, user: null, tokens: null },
                Cmd.navigate({ pathname: '/login', method: 'replace' })
            );

        case 'AUTH_ERROR_DETECTED':
            if (msg.status === 401 && model.tokens?.refresh) {
                return update(model, { type: 'REFRESH_STARTED' });
            }
            return update(model, { type: 'SESSION_EXPIRED', reason: 'Error de autenticación' });

        case 'REFRESH_STARTED':
            if (model.status === AuthStatus.REFRESHING || !model.tokens?.refresh) {
                return singleton(model);
            }
            return ret(
                { ...model, status: AuthStatus.REFRESHING },
                RemoteDataHttp.fetch(
                    () => AuthRepository.refresh(),
                    (result) => {
                        if (result.type === 'Success' && result.data.success) {
                            return {
                                type: 'REFRESH_SUCCEEDED',
                                tokens: {
                                    access: result.data.data.accessToken,
                                    refresh: result.data.data.refreshToken || model.tokens?.refresh
                                }
                            };
                        }
                        return {
                            type: 'REFRESH_FAILED',
                            error: result.type === 'Failure' ? String(result.error) : 'Refresh failed'
                        };
                    },
                    'AUTH_REFRESH'
                )
            );

        case 'REFRESH_SUCCEEDED':
            return singleton({
                ...model,
                status: AuthStatus.AUTHENTICATED,
                tokens: {
                    access: msg.tokens.access,
                    refresh: msg.tokens.refresh || model.tokens?.refresh || ''
                }
            });

        case 'REFRESH_FAILED':
            return update(model, { type: 'SESSION_EXPIRED', reason: msg.error });

        case 'SESSION_EXPIRED':
            // El SSOT (AuthRepository) ya notificó la expiración.
            // CoreModule se encarga de llamar a logout().
            // v1 solo proyecta el estado de expiración para la UI y navega al login.
            return ret(
                { ...model, status: AuthStatus.EXPIRED, user: null, tokens: null },
                Cmd.navigate({ pathname: '/login', method: 'replace' })
            );

        default:
            return singleton(model);
    }
}
