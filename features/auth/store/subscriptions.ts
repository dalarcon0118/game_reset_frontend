import { Sub, SubDescriptor } from '@/shared/core/tea-utils';
import { AuthModel, AuthMsg, AuthMsgType } from './types';
import { AuthRepository } from '../../../shared/repositories/auth';

/**
 * Subscripciones para el módulo de Auth.
 * Se encarga de observar cambios de sesión emitidos por el repositorio.
 */
export const authSubscriptions = (model: AuthModel): SubDescriptor<AuthMsg> => {
    const subs: SubDescriptor<AuthMsg>[] = [];

    // 1. Monitoreo de Sesión Agnostic
    // El repositorio se encarga de la lógica de red y refresco de tokens.
    // Nosotros reaccionamos a cambios de identidad, expiración y refresco.
    subs.push(
        Sub.custom((dispatch) => {
            const unsubSession = AuthRepository.onSessionChange((user) => {
                dispatch({
                    type: AuthMsgType.USER_CHANGED,
                    user
                });
            });

            const unsubExpired = AuthRepository.onSessionExpired((reason) => {
                dispatch({
                    type: AuthMsgType.SESSION_EXPIRED,
                    reason
                });
            });

            const unsubRefreshed = AuthRepository.onTokenRefreshed((token) => {
                dispatch({
                    type: AuthMsgType.TOKEN_REFRESHED,
                    token
                });
            });

            return () => {
                unsubSession();
                unsubExpired();
                unsubRefreshed();
            };
        }, 'auth-session-monitor')
    );

    return Sub.batch(subs);
};
