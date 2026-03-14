import { match } from 'ts-pattern';
import { AuthModel, AuthStatus } from './model';
import {
    AuthMsg,
    HYDRATE_LOGIN_CONTEXT_REQUESTED,
    INITIAL_SESSION_CHECK_REQUESTED,
    SESSION_HYDRATED,
    SESSION_CHANGED,
    LOGIN_REQUESTED,
    LOGIN_SUCCEEDED,
    LOGIN_FAILED,
    LOGIN_USERNAME_UPDATED,
    LOGIN_PIN_UPDATED,
    LOGOUT_REQUESTED,
    LOGOUT_COMPLETED,
    AUTH_ERROR_DETECTED,
    REFRESH_STARTED,
    REFRESH_SUCCEEDED,
    REFRESH_FAILED,
    SESSION_EXPIRED as SESSION_EXPIRED_MSG,
    GLOBAL_SIGNAL_RECEIVED
} from './msg';
import { Return, singleton, ret } from '../../core/tea-utils/return';
import { Cmd } from '../../core/tea-utils/cmd';
import { RemoteDataHttp } from '../../core/tea-utils/remote.data.http';
import { AuthRepository } from '../../repositories/auth';
import { logger } from '../../utils/logger';
import { GLOBAL_LOGOUT } from '@/config/signals';

const log = logger.withTag('AUTH_V1_UPDATE');

// ID de instancia para detectar re-creaciones del store
const STORE_INSTANCE_ID = Math.random().toString(36).substring(7).toUpperCase();
log.debug(`AuthModuleV1.update loaded - Instance: #${STORE_INSTANCE_ID}`);

/**
 * Update Function (v1)
 * 
 * Orquestador reactivo de la sesión. 
 * El SSOT es el AuthRepository; este update solo proyecta el estado.
 */
export function update(model: AuthModel, msg: AuthMsg): Return<AuthModel, AuthMsg> {
    log.debug(`[${STORE_INSTANCE_ID}] Processing message: ${msg.type}`, {
        currentStatus: model.status,
        hasUser: !!model.user
    });

    return match<AuthMsg, Return<AuthModel, AuthMsg>>(msg)
        .with(HYDRATE_LOGIN_CONTEXT_REQUESTED.type(), () => {
            log.info('Hydrate login context requested in AuthV1');
            return ret(
                { ...model, status: AuthStatus.BOOTSTRAPPING },
                RemoteDataHttp.fetch(
                    () => AuthRepository.getLastUsername(),
                    (result) => {
                        const username = result.type === 'Success' ? result.data : '';
                        log.info('Last username hydrated during bootstrap', { username });
                        return LOGIN_USERNAME_UPDATED({ username: username || '' });
                    },
                    'AUTH_HYDRATE_USERNAME'
                )
            );
        })

        .with(INITIAL_SESSION_CHECK_REQUESTED.type(), () => {
            log.warn('INITIAL_SESSION_CHECK_REQUESTED ignored (Deprecated in favor of SSOT Subscriptions)');
            return singleton(model);
        })

        .with(SESSION_HYDRATED.type(), () => {
            log.warn('SESSION_HYDRATED ignored (Deprecated in favor of SESSION_CHANGED from SSOT Subscriptions)');
            return singleton(model);
        })

        .with(SESSION_CHANGED.type(), ({ payload }) => {
            // Reacción directa a cambios en el repositorio (SSOT)
            if (payload.user) {
                return singleton({
                    ...model,
                    status: payload.isOffline ? AuthStatus.AUTHENTICATED_OFFLINE : AuthStatus.AUTHENTICATED,
                    user: payload.user,
                    isOffline: payload.isOffline
                });
            }
            return singleton({
                ...model,
                status: AuthStatus.UNAUTHENTICATED,
                user: null,
                tokens: null
            });
        })

        .with(LOGIN_REQUESTED.type(), ({ payload }) => {
            return ret(
                { ...model, status: AuthStatus.AUTHENTICATING, error: null },
                RemoteDataHttp.fetch(
                    () => AuthRepository.login(payload.username, payload.pin),
                    (result) => {
                        if (result.type === 'Success') {
                            if (result.data.success) {
                                return LOGIN_SUCCEEDED({
                                    user: result.data.data.user,
                                    tokens: {
                                        access: result.data.data.accessToken,
                                        refresh: result.data.data.refreshToken
                                    },
                                    isOffline: result.data.data.isOffline
                                });
                            }
                            return LOGIN_FAILED({ error: result.data.error.message });
                        }
                        return LOGIN_FAILED({ error: 'Error de conexión' });
                    },
                    'AUTH_LOGIN'
                )
            );
        })

        .with(LOGIN_SUCCEEDED.type(), ({ payload }) => {
            // El repositorio ya guardó la sesión, v1 solo actualiza el estado local
            return singleton({
                ...model,
                status: payload.isOffline ? AuthStatus.AUTHENTICATED_OFFLINE : AuthStatus.AUTHENTICATED,
                user: payload.user,
                tokens: payload.tokens,
                isOffline: payload.isOffline,
                error: null,
                loginSession: { ...model.loginSession, pin: '' } // Limpiar PIN al entrar
            });
        })

        .with(LOGIN_FAILED.type(), ({ payload }) => {
            return singleton({
                ...model,
                status: AuthStatus.UNAUTHENTICATED,
                error: payload.error,
                loginSession: { ...model.loginSession, pin: '' } // Limpiar PIN al fallar
            });
        })

        .with(LOGIN_USERNAME_UPDATED.type(), ({ payload }) => {
            return singleton({
                ...model,
                loginSession: { ...model.loginSession, username: payload.username }
            });
        })

        .with(LOGIN_PIN_UPDATED.type(), ({ payload }) => {
            return singleton({
                ...model,
                loginSession: { ...model.loginSession, pin: payload.pin }
            });
        })

        .with(LOGOUT_REQUESTED.type(), () => {
            return ret(
                { ...model, status: AuthStatus.LOGGING_OUT },
                RemoteDataHttp.fetch(
                    () => AuthRepository.logout(),
                    () => LOGOUT_COMPLETED(),
                    'AUTH_LOGOUT'
                )
            );
        })

        .with(LOGOUT_COMPLETED.type(), () => {
            return ret(
                { ...model, status: AuthStatus.UNAUTHENTICATED, user: null, tokens: null },
                Cmd.navigate({ pathname: '/login', method: 'replace' })
            );
        })

        .with(AUTH_ERROR_DETECTED.type(), ({ payload }) => {
            if (payload.status === 401 && model.tokens?.refresh) {
                return update(model, REFRESH_STARTED());
            }
            return update(model, SESSION_EXPIRED_MSG({ reason: 'Error de autenticación' }));
        })

        .with(REFRESH_STARTED.type(), () => {
            if (model.status === AuthStatus.REFRESHING || !model.tokens?.refresh) {
                return singleton(model);
            }
            return ret(
                { ...model, status: AuthStatus.REFRESHING },
                RemoteDataHttp.fetch(
                    () => AuthRepository.refresh(),
                    (result) => {
                        if (result.type === 'Success' && result.data.success) {
                            return REFRESH_SUCCEEDED({
                                tokens: {
                                    access: result.data.data.accessToken,
                                    refresh: result.data.data.refreshToken || model.tokens?.refresh
                                }
                            });
                        }
                        return REFRESH_FAILED({
                            error: result.type === 'Failure' ? String(result.error) : 'Refresh failed'
                        });
                    },
                    'AUTH_REFRESH'
                )
            );
        })

        .with(REFRESH_SUCCEEDED.type(), ({ payload }) => {
            return singleton({
                ...model,
                status: AuthStatus.AUTHENTICATED,
                tokens: {
                    access: payload.tokens.access,
                    refresh: payload.tokens.refresh || model.tokens?.refresh || ''
                }
            });
        })

        .with(REFRESH_FAILED.type(), ({ payload }) => {
            return update(model, SESSION_EXPIRED_MSG({ reason: payload.error }));
        })

        .with(SESSION_EXPIRED_MSG.type(), () => {
            // El SSOT (AuthRepository) ya notificó la expiración.
            // CoreModule se encarga de llamar a logout().
            // v1 solo proyecta el estado de expiración para la UI y navega al login.
            return ret(
                { ...model, status: AuthStatus.EXPIRED, user: null, tokens: null },
                Cmd.navigate({ pathname: '/login', method: 'replace' })
            );
        })

        .with(GLOBAL_SIGNAL_RECEIVED.type(), ({ payload }) => {
            return match(payload.payload)
                .with({ type: GLOBAL_LOGOUT.kind }, () => {
                    log.info('Global Logout signal received in AuthV1');
                    return update(model, LOGOUT_REQUESTED());
                })
                .otherwise(() => singleton(model));
        })

        .otherwise(() => singleton(model));
}
