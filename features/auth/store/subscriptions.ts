import { Sub, SubDescriptor } from '@/shared/core/tea-utils';
import { AuthModel, AuthMsg, AuthMsgType } from './types';
import { AuthRepository } from '../../../shared/repositories/auth';
import { SessionSignalBus } from '@/shared/auth/session/session.signal.bus';
import { SessionSignalType } from '@/shared/auth/session/session.types';

/**
 * Subscripciones para el módulo de Auth.
 * Se encarga de observar cambios de sesión emitidos por el repositorio y el coordinador.
 */
export const authSubscriptions = (model: AuthModel): SubDescriptor<AuthMsg> => {
    const subs: SubDescriptor<AuthMsg>[] = [];

    // 1. Monitoreo de Señales del Coordinador (Signal Bus)
    subs.push(
        Sub.custom((dispatch) => {
            const bus = SessionSignalBus.getInstance();
            return bus.subscribe((signal) => {
                switch (signal.type) {
                    case SessionSignalType.SESSION_HYDRATED:
                        dispatch({
                            type: AuthMsgType.SESSION_HYDRATED,
                            user: signal.payload.user,
                            tokenState: signal.payload.tokenState
                        });
                        break;
                    case SessionSignalType.SESSION_EXPIRED:
                        dispatch({
                            type: AuthMsgType.SESSION_EXPIRED,
                            reason: signal.payload?.reason
                        });
                        break;
                    case SessionSignalType.TOKEN_REFRESHED:
                        dispatch({
                            type: AuthMsgType.TOKEN_REFRESHED,
                            token: signal.payload?.token
                        });
                        break;
                }
            });
        }, 'auth-coordinator-signal-bus')
    );

    // 2. Monitoreo de Sesión Agnostic
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
