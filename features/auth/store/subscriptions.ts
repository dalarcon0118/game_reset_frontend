import { Sub, SubDescriptor } from '../../../shared/core/sub';
import { AuthModel, AuthMsg, AuthMsgType } from './types';
import NetInfo from '@react-native-community/netinfo';
import { isServerReachable } from '../../../shared/utils/network';

/**
 * Subscripciones para el módulo de Auth.
 * Monitorea el estado de la sesión y la conectividad.
 */
export const authSubscriptions = (model: AuthModel): SubDescriptor<AuthMsg> => {
    const subs: SubDescriptor<AuthMsg>[] = [];

    // 1. Monitoreo de Conectividad (NetInfo)
    subs.push(
        Sub.custom((dispatch) => {
            const unsubscribe = NetInfo.addEventListener(async (state) => {
                if (state.isConnected) {
                    // Si hay red, verificamos si el servidor es alcanzable
                    const reachable = await isServerReachable();
                    dispatch({
                        type: AuthMsgType.CONNECTION_STATUS_CHANGED,
                        isOnline: reachable
                    });
                } else {
                    dispatch({
                        type: AuthMsgType.CONNECTION_STATUS_CHANGED,
                        isOnline: false
                    });
                }
            });
            return unsubscribe;
        }, 'auth-connectivity-monitor')
    );

    // 2. Monitoreo de Sesión (cada minuto si no estamos en offline)
    if (model.isAuthenticated && !model.isOffline) {
        subs.push(
            Sub.every(
                60000, // 1 minuto
                { type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED },
                'auth-session-monitor'
            )
        );
    }

    // 3. Reintento de Conexión (cada 30 segundos si estamos en modo offline)
    if (model.isAuthenticated && model.isOffline) {
        subs.push(
            Sub.custom((dispatch) => {
                const checkConnection = async () => {
                    const reachable = await isServerReachable();
                    if (reachable) {
                        dispatch({
                            type: AuthMsgType.CONNECTION_STATUS_CHANGED,
                            isOnline: true
                        });
                    }
                };

                // Verificar inmediatamente al entrar en este modo
                checkConnection();

                const intervalId = setInterval(checkConnection, 30000); // 30 segundos
                return () => clearInterval(intervalId);
            }, 'auth-offline-reconnect-monitor')
        );
    }

    return Sub.batch(subs);
};
