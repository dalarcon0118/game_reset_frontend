import { AuthModel } from './model';
import * as msg from './msg';
import { Sub, SubDescriptor } from '../../core/tea-utils';
import { GlobalSignals } from '@/config/signals';
import { AuthRepository } from '../../repositories/auth';
import { match } from 'ts-pattern';
import logger from '@/shared/utils/logger';

/**
 * Auth Subscriptions
 * 
 * Implementa la reactividad del servicio v1 escuchando cambios 
 * directamente desde el AuthRepository (SSOT).
 */
export const authSubscriptions = (model: AuthModel): SubDescriptor<msg.AuthMsg> => {
    const log = logger.withTag('authSubscriptions');

    return Sub.batch([
        // 1. Escuchar cambios de sesión directamente del AuthRepository (SSOT)
        Sub.custom(
            (dispatch) => {
                return AuthRepository.onSessionChange((user) => {
                    dispatch(msg.SESSION_CHANGED({
                        user: user,
                        isOffline: false
                    }));
                });
            },
            'auth_v1_session_sync'
        ),

        // 2. Escuchar expiraciones globales (SSOT)
        Sub.custom(
            (dispatch) => {
                return AuthRepository.onSessionExpired((reason) => {
                    dispatch(msg.SESSION_EXPIRED({
                        reason
                    }));
                });
            },
            'auth_v1_expiration_sync'
        ),

        // 3. Escuchar refrescos automáticos (SSOT)
        Sub.custom(
            (dispatch) => {
                return AuthRepository.onTokenRefreshed((token) => {
                    dispatch(msg.REFRESH_SUCCEEDED({
                        tokens: { access: token, refresh: '' } // refresh se mantiene del modelo o storage
                    }));
                });
            },
            'auth_v1_token_sync'
        ),

        // 4. Escuchar mensajes globales (GLOBAL_LOGOUT, GLOBAL_LOGIN)
        Sub.receiveMsg(
            GlobalSignals.LOGOUT,
            (_, dispatch) => {
                dispatch(msg.LOGOUT_REQUESTED());
            },
            'auth_global_logout_handler'
        ),

        Sub.receiveMsg(
            GlobalSignals.LOGIN,
            (payload, dispatch) => {
                dispatch(msg.LOGIN_REQUESTED(payload));
            },
            'auth_global_login_handler'
        )
    ]);
};
