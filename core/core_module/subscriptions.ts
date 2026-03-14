
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { Sub, SubDescriptor } from '@core/tea-utils/sub';
import { AuthRepository, User } from '@shared/repositories/auth';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';

/**
 * Define las suscripciones reactivas para el CoreModule.
 */
export function subscriptions(model: CoreModel): SubDescriptor<CoreMsg> {
  return Sub.batch([
    // 1. Suscripción al cambio de sesión en AuthRepository
    Sub.custom((dispatch) => {
      return AuthRepository.onSessionChange((user: User | null) => {
        dispatch({
          type: 'SESSION_STATUS_CHANGED',
          payload: user ? 'AUTHENTICATED' : 'UNAUTHENTICATED'
        });
      });
    }, 'CORE_AUTH_SESSION_SYNC'),

    // 2. Suscripción a expiración de sesión (Señal global)
    Sub.custom((dispatch) => {
      return AuthRepository.onSessionExpired((reason: string) => {
        dispatch({
          type: 'SESSION_EXPIRED',
          reason
        });
      });
    }, 'CORE_AUTH_EXPIRATION_SYNC'),

    // 3. Suscripción a eventos de mantenimiento (SystemJanitor)
    Sub.custom((dispatch) => {
      return offlineEventBus.subscribe((event) => {
        if (event.type === 'MAINTENANCE_COMPLETED') {
          dispatch({
            type: 'MAINTENANCE_COMPLETED',
            payload: event.payload as { date: string; status: 'ready' }
          });
        }
      });
    }, 'CORE_MAINTENANCE_SYNC'),
  ]);
}
