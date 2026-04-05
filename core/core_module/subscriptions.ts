
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { Sub, SubDescriptor } from '@core/tea-utils/sub';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';
import { CoreService } from './service';

/**
 * Define las suscripciones reactivas para el CoreModule.
 */
export function subscriptions(model: CoreModel): SubDescriptor<CoreMsg> {
  const isBootstraping = model.bootstrapStatus !== 'IDLE';
  const isAuthenticated = model.sessionStatus === 'AUTHENTICATED';

  return Sub.batch([
    // 1. Suscripción al sensor de conectividad global (Activo desde el inicio del bootstrap)
    isBootstraping ? Sub.custom((dispatch) => {
      return CoreService.subscribeToConnectivity(dispatch);
    }, 'CORE_CONNECTIVITY_SENSOR') : Sub.none(),

    // 2. Latido Temporal: Cada 15 minutos si está autenticado para refrescar el Time Anchor (Fase 3: Riesgo 2)
    isAuthenticated ? Sub.every(15 * 60 * 1000, { type: 'TIME_ANCHOR_TICK' }, 'TIME_ANCHOR_TICKER') : Sub.none(),

    // 2. Suscripción al cambio de sesión en AuthRepository
    Sub.custom((dispatch) => {
      return CoreService.subscribeToAuthSession(dispatch);
    }, 'CORE_AUTH_SESSION_SYNC'),

    // 2. Suscripción a expiración de sesión (Señal global)
    Sub.custom((dispatch) => {
      return CoreService.subscribeToAuthExpired(dispatch);
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
