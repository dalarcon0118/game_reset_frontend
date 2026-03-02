import { Sub, SubDescriptor } from '../../../shared/core/sub';
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
    // Nosotros solo reaccionamos cuando la identidad del usuario cambia.
    subs.push(
        Sub.custom((dispatch) => {
            return AuthRepository.onSessionChange((user) => {
                dispatch({
                    type: AuthMsgType.USER_CHANGED,
                    user
                });
            });
        }, 'auth-session-identity-monitor')
    );

    return Sub.batch(subs);
};
