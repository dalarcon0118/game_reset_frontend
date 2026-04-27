import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { Sub, SubDescriptor } from '@core/tea-utils/sub';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';
import { CoreService } from './service';
import { logger } from '../../shared/utils/logger';
import { inactivityTracker } from './services/inactivity-tracker.service';

const log = logger.withTag('CORE_SUBSCRIPTIONS');
const INACTIVITY_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Define las suscripciones reactivas para el CoreModule.
 */
export function subscriptions(model: CoreModel): SubDescriptor<CoreMsg> {
  const isBootstraping = model.bootstrapStatus !== 'IDLE';
  const isAuthenticated = model.sessionStatus === 'AUTHENTICATED';

  return Sub.batch([
    // 1. Suscripción al sensor de conectividad global (Activo desde el inicio del bootstrap)
    isBootstraping
      ? Sub.custom((dispatch) => {
        return CoreService.subscribeToConnectivity(dispatch);
      }, 'CORE_CONNECTIVITY_SENSOR')
      : Sub.none(),

    // 1b. Suscripción a errores fatales del servidor (5xx) - Siempre activa para capturar errores tempranos
    Sub.custom((dispatch) => {
      return CoreService.subscribeToApiErrors(dispatch);
    }, 'CORE_API_ERROR_SENSOR'),

    // 2. Timer de inactividad basado en InactivityTracker (SSOT)
    // FIX: Antes se reseteaba ciegamente al volver a foreground,
    // anulando la detección de inactividad tras tiempo en background.
    // Ahora: al volver a foreground, verifica si ya pasó el umbral
    // y despacha CHECK_INACTIVITY inmediatamente si es necesario.
    isAuthenticated
      ? Sub.custom((dispatch) => {
        let timerId: ReturnType<typeof setTimeout> | null = null;

        const resetTimer = () => {
          if (timerId) clearTimeout(timerId);
          timerId = setTimeout(() => {
            dispatch({ type: 'CHECK_INACTIVITY' });
          }, INACTIVITY_THRESHOLD_MS);
        };

        // Iniciar timer y registrar actividad
        resetTimer();
        inactivityTracker.recordActivity('subscription_init');

        // Al volver a foreground: verificar inactividad ANTES de resetear
        const { AppState } = require('react-native');
        const subscription = AppState.addEventListener('change', (nextState: string) => {
          if (nextState === 'active') {
            // FIX: Si ya pasó el umbral de inactividad mientras estaba en background,
            // despachar CHECK_INACTIVITY inmediatamente en vez de resetear el timer
            if (inactivityTracker.isInactive()) {
              log.info('[INACTIVITY_TIMER] App returned to foreground after inactivity threshold - dispatching CHECK_INACTIVITY');
              dispatch({ type: 'CHECK_INACTIVITY' });
              return;
            }
            // Si aún no ha pasado el umbral, registrar la actividad y resetear el timer
            inactivityTracker.recordActivity('foreground');
            resetTimer();
          }
        });

        return () => {
          if (timerId) clearTimeout(timerId);
          subscription.remove();
        };
      }, 'ACTIVITY_BASED_INACTIVITY_TIMER')
      : Sub.none(),

    // 2b. Latido Temporal: Cada 15 minutos para refrescar Time Anchor
    isAuthenticated
      ? Sub.every(15 * 60 * 1000, { type: 'TIME_ANCHOR_TICK' } as CoreMsg, 'TIME_ANCHOR_TICK_TIMER')
      : Sub.none(),

    // 3. Suscripción a eventos de almacenamiento offline (para sincronización reactiva)
    Sub.custom((dispatch) => {
      const unsubscribe = offlineEventBus.subscribe((event) => {
        if (event.type === 'ENTITY_CHANGED' && event.entity.includes('pending_bet')) {
          log.info('[CORE_SUBSCRIPTIONS] Pending bet changed, triggering sync', { entity: event.entity });
        }
      });
      return unsubscribe;
    }, 'OFFLINE_EVENTS_SUBSCRIBER'),

    // 4. Verificación periódica de expiración de sesión (cada 5 minutos)
    isAuthenticated
      ? Sub.every(5 * 60 * 1000, { type: 'CHECK_SESSION_EXPIRATION' } as CoreMsg, 'SESSION_EXPIRATION_TIMER')
      : Sub.none()
  ]);
}