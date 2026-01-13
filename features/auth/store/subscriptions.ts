import { Sub, SubDescriptor } from '../../../shared/core/sub';
import { AuthModel, AuthMsg, AuthMsgType } from './types';

/**
 * Subscripciones para el módulo de Auth.
 * Monitorea el estado de la sesión de forma proactiva.
 */
export const authSubscriptions = (model: AuthModel): SubDescriptor<AuthMsg> => {
    // Si el usuario está autenticado, monitoreamos la validez del token cada minuto
    if (model.isAuthenticated) {
        return Sub.every(
            60000, // 1 minuto
            { type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED },
            'auth-session-monitor'
        );
    }

    return Sub.none();
};
