import { match } from 'ts-pattern';
import { AuthModel, AuthStatus } from './model';
import {
    AuthMsg,
    INITIAL_SESSION_CHECK_REQUESTED,
    SESSION_HYDRATED,
    SESSION_CHANGED,
    LOGIN_REQUESTED,
    LOGIN_SUCCEEDED,
    PIN_CHANGE_REQUIRED,
    LOGIN_FAILED,
    LOGOUT_REQUESTED,
    LOGOUT_COMPLETED,
    AUTH_ERROR_DETECTED,
    REFRESH_STARTED,
    REFRESH_SUCCEEDED,
    REFRESH_FAILED,
    SESSION_EXPIRED as SESSION_EXPIRED_MSG,
    RESET_AUTH_STATE,
    GLOBAL_SIGNAL_RECEIVED
} from './msg';
import { Return, singleton, ret } from '../../core/tea-utils/return';
import { Cmd } from '../../core/tea-utils/cmd';
import { RemoteDataHttp } from '../../core/tea-utils/remote.data.http';
import { AuthRepository } from '../../repositories/auth';
import { AuthErrorType } from '../../repositories/auth/types/types';
import { logger } from '../../utils/logger';
import { GLOBAL_LOGOUT } from '@/config/signals';
import { sessionLockMediator } from '@/core/core_module/services/session-lock.mediator';
import { inactivityTracker } from '@/core/core_module/services/inactivity-tracker.service';

const log = logger.withTag('AUTH_V1_UPDATE');
const STORE_INSTANCE_ID = Math.random().toString(36).substring(7).toUpperCase();
log.debug(`AuthModuleV1.update loaded - Instance: #${STORE_INSTANCE_ID}`);

export function update(model: AuthModel, msg: AuthMsg): Return<AuthModel, AuthMsg> {
    log.debug(`[${STORE_INSTANCE_ID}] Processing message: ${msg.type}`, {
        currentStatus: model.status,
        hasUser: !!model.user
    });

    return match<AuthMsg, Return<AuthModel, AuthMsg>>(msg)
        .with(INITIAL_SESSION_CHECK_REQUESTED.type(), () => {
            log.warn('INITIAL_SESSION_CHECK_REQUESTED ignored (Deprecated)');
            return singleton(model);
        })
        .with(SESSION_HYDRATED.type(), () => {
            log.warn('SESSION_HYDRATED ignored (Deprecated)');
            return singleton(model);
        })
        .with(SESSION_CHANGED.type(), ({ payload }) => {
            if (payload.user) {
                log.info('Sesión detectada vía SSOT');
                return singleton({
                    ...model,
                    status: payload.isOffline ? AuthStatus.AUTHENTICATED_OFFLINE : AuthStatus.AUTHENTICATED,
                    user: payload.user,
                    isOffline: payload.isOffline
                });
            }
            return singleton({ ...model, status: AuthStatus.UNAUTHENTICATED, user: null, tokens: null });
        })
        .with(LOGIN_REQUESTED.type(), ({ payload }) => {
            if (model.status === AuthStatus.AUTHENTICATED || model.status === AuthStatus.AUTHENTICATED_OFFLINE) {
                log.warn('Ignorando LOGIN_REQUESTED: El usuario ya está autenticado');
                return singleton(model);
            }
            return ret(
                { ...model, status: AuthStatus.AUTHENTICATING, error: null },
                RemoteDataHttp.fetch(
                    () => AuthRepository.login(payload.username, payload.pin),
                    (result) => {
                        if (result.type === 'Success') {
                            if (result.data.success) {
                                return LOGIN_SUCCEEDED({
                                    user: result.data.data.user,
                                    tokens: { access: result.data.data.accessToken, refresh: result.data.data.refreshToken },
                                    isOffline: result.data.data.isOffline,
                                    needs_pin_change: result.data.data.needs_pin_change
                                });
                            }
                            return LOGIN_FAILED({ error: result.data.error.message, type: result.data.error.type });
                        }
                        let detailedErrorMessage = 'Error de conexión';
                        const resultError = (result as any).error;
                        if (resultError?.userMessage) {
                            detailedErrorMessage = resultError.userMessage;
                        } else if (resultError?.message) {
                            const errorData = resultError.data;
                            detailedErrorMessage = errorData?.detail || resultError.message;
                        }
                        return LOGIN_FAILED({ error: detailedErrorMessage, type: AuthErrorType.CONNECTION_ERROR });
                    },
                    'AUTH_LOGIN'
                )
            );
        })
        .with(LOGIN_SUCCEEDED.type(), ({ payload }) => {
            sessionLockMediator.unlock();
    inactivityTracker.reset(); // Resetear tracker de inactividad tras login exitoso
            logger.info('[AUTH] LOGIN_SUCCEEDED', { userId: payload.user?.id });
            return ret(
                {
                    ...model,
                    status: payload.isOffline ? AuthStatus.AUTHENTICATED_OFFLINE : AuthStatus.AUTHENTICATED,
                    user: payload.user,
                    tokens: payload.tokens,
                    isOffline: payload.isOffline,
                    error: null,
                    needs_pin_change: payload.needs_pin_change || false
                },
                payload.needs_pin_change
                    ? Cmd.batch([Cmd.sendMsg(PIN_CHANGE_REQUIRED()), Cmd.navigate({ pathname: '/lister/change_password' })])
                    : Cmd.navigate({ pathname: '/lister/dashboard', method: 'replace' })
            );
        })
        .with(PIN_CHANGE_REQUIRED.type(), () => singleton(model))
        .with(LOGIN_FAILED.type(), ({ payload }) => {
            let status: AuthStatus;
            if (payload.type === AuthErrorType.DEVICE_LOCKED) {
                status = AuthStatus.DEVICE_LOCKED;
            } else if (
                payload.type === AuthErrorType.CONNECTION_ERROR ||
                payload.type === AuthErrorType.OFFLINE_NOT_ALLOWED ||
                payload.type === AuthErrorType.CONNECTION_ERROR_FIRST_AUTH ||
                payload.type === AuthErrorType.OFFLINE_NO_DRAWS
            ) {
                status = AuthStatus.CONNECTION_ERROR;
            } else if (payload.type === AuthErrorType.ACCOUNT_DISABLED || payload.type === AuthErrorType.ACCOUNT_LOCKED) {
                status = AuthStatus.UNAUTHENTICATED;
            } else {
                status = AuthStatus.UNAUTHENTICATED;
            }
            return singleton({ ...model, status, error: payload.error });
        })
        .with(LOGOUT_REQUESTED.type(), () => {
            return ret(
                { ...model, status: AuthStatus.LOGGING_OUT },
                RemoteDataHttp.fetch(() => AuthRepository.logout(), () => LOGOUT_COMPLETED(), 'AUTH_LOGOUT')
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
            if (payload.status === 403) {
                return singleton({ ...model, status: AuthStatus.DEVICE_LOCKED, error: 'Este dispositivo ya no está autorizado.' });
            }
            if ([504, 502, 503, 0].includes(payload.status)) {
                return singleton({ ...model, status: AuthStatus.CONNECTION_ERROR, error: 'No se puede conectar al servidor.' });
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
                            return REFRESH_SUCCEEDED({ tokens: { access: result.data.data.accessToken, refresh: result.data.data.refreshToken || model.tokens?.refresh } });
                        }
                        return REFRESH_FAILED({ error: result.type === 'Failure' ? String(result.error) : 'Refresh failed' });
                    },
                    'AUTH_REFRESH'
                )
            );
        })
        .with(REFRESH_SUCCEEDED.type(), ({ payload }) => {
            return singleton({
                ...model,
                status: AuthStatus.AUTHENTICATED,
                tokens: { access: payload.tokens.access, refresh: payload.tokens.refresh || model.tokens?.refresh || '' }
            });
        })
        .with(REFRESH_FAILED.type(), ({ payload }) => {
            return update(model, SESSION_EXPIRED_MSG({ reason: payload.error }));
        })
        .with(SESSION_EXPIRED_MSG.type(), () => {
            return ret(
                { ...model, status: AuthStatus.EXPIRED, user: null, tokens: null },
                Cmd.navigate({ pathname: '/login', method: 'replace' })
            );
        })
        .with(RESET_AUTH_STATE.type(), () => {
            return singleton({ ...model, status: AuthStatus.UNAUTHENTICATED, error: null });
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