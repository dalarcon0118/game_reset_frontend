import { AuthModel } from './model';
import { AuthMsg } from './msg';
import { Sub, SubDescriptor } from '../../core/tea-utils/sub';
import { AuthRepository } from '../../repositories/auth';

/**
 * Auth Subscriptions
 * 
 * Implementa la reactividad del servicio v1 escuchando cambios 
 * directamente desde el AuthRepository (SSOT).
 */
export const authSubscriptions = (model: AuthModel): SubDescriptor<AuthMsg> => {
    return Sub.batch([
        // 1. Escuchar cambios de sesión directamente del AuthRepository (SSOT)
        Sub.custom(
            (dispatch) => {
                return AuthRepository.onSessionChange((user) => {
                    dispatch({
                        type: 'SESSION_CHANGED',
                        user: user,
                        isOffline: false
                    });
                });
            },
            'auth_v1_session_sync'
        ),

        // 2. Escuchar expiraciones globales (SSOT)
        Sub.custom(
            (dispatch) => {
                return AuthRepository.onSessionExpired((reason) => {
                    dispatch({
                        type: 'SESSION_EXPIRED',
                        reason
                    });
                });
            },
            'auth_v1_expiration_sync'
        ),

        // 3. Escuchar refrescos automáticos (SSOT)
        Sub.custom(
            (dispatch) => {
                return AuthRepository.onTokenRefreshed((token) => {
                    dispatch({
                        type: 'REFRESH_SUCCEEDED',
                        tokens: { access: token, refresh: '' } // refresh se mantiene del modelo o storage
                    });
                });
            },
            'auth_v1_token_sync'
        )
    ]);
};
