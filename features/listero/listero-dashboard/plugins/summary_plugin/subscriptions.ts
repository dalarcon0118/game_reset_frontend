import { Sub } from '@core/tea-utils';
import { Model } from './model';
import { Msg, GET_FINANCIAL_BETS, DASHBOARD_DATA_SYNCED } from './msg';
import { dashboardService } from '../../services/dashboard.service';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '@/shared/repositories/system/time';

const log = logger.withTag('SUMMARY_PLUGIN_SUBS');

/**
 * Resetea el estado de sincronización. 
 * Implementado para consistencia con el protocolo de limpieza de plugins.
 */
export const resetSyncState = () => {
  log.info('Resetting summary_plugin sync state');
};

export const subscriptions = (model: Model) => {
  // 1. Suscripción reactiva al Store del Dashboard (Host)
  // Observamos cambios en el model del host para sincronizar userStructureId y todayStart
  const dashboardSyncSub = Sub.watchStore(
    'ListeroDashboard',
    (hostState: any) => {
      // Resiliencia ante la estructura del estado (Zustand state vs nested model)
      const hostModel = hostState?.model || hostState;

      // Calculamos el hoy localmente ya que el Dashboard no lo persiste en su modelo
      const now = Date.now();
      const trustedNow = TimerRepository.getTrustedNow(now);
      const trustedDate = new Date(trustedNow);
      const todayStart = new Date(
        trustedDate.getFullYear(),
        trustedDate.getMonth(),
        trustedDate.getDate()
      ).getTime();

      const commission = hostModel?.commissionRate;
      if (commission !== undefined) {
        log.debug('[SUMMARY_PLUGIN_SUBS] Incoming data sync from Host:', {
          structureId: hostModel?.userStructureId,
          commissionRate: commission,
          backendPremiums: hostModel?.dailyTotals?.premiumsPaid
        });
      }

      return {
        userStructureId: hostModel?.userStructureId,
        commissionRate: hostModel?.commissionRate,
        todayStart: todayStart,
        trustedNow: trustedNow,
        backendPremiums: hostModel?.dailyTotals?.premiumsPaid || 0
      };
    },
    (data) => {
      log.debug('[DIAGNOSTIC] Dispatching DASHBOARD_DATA_SYNCED with data:', data);
      return DASHBOARD_DATA_SYNCED(data);
    },
    'summary-dashboard-sync'
  );

  // 2. Suscripción a invalidaciones del servicio (Dashboard Refresh)
  const dashboardWatchSub = Sub.custom((dispatch) => {
    log.info('Activating Dashboard Invalidation Listener');

    const unsubscribe = dashboardService.onDashboardInvalided(() => {
      log.info('Refresh Event Received from DashboardService');
      // 🔄 Refrescar finanzas (Recalcular desde BetRepository)
      dispatch(GET_FINANCIAL_BETS());
    });
    return unsubscribe;
  }, 'summary-dashboard-watch');

  // Si no tenemos el contexto inicializado, solo devolvemos la sincronización y el watch (sin contexto para refrescar, pero el listener activo)
  if (!model.context) {
    return Sub.batch([dashboardSyncSub, dashboardWatchSub]);
  }

  return Sub.batch([dashboardSyncSub, dashboardWatchSub]);
};
