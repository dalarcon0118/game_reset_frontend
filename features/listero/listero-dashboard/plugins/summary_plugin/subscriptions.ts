import { Sub } from '@core/tea-utils';
import { Model } from './model';
import { Msg, GET_FINANCIAL_BETS, DASHBOARD_DATA_SYNCED } from './msg';
import { dashboardService } from '../../services/dashboard.service';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SUMMARY_PLUGIN_SUBS');

export const subscriptions = (model: Model) => {
  // 1. Suscripción reactiva al Store del Dashboard (Host)
  // Observamos cambios en el model del host para sincronizar userStructureId y todayStart
  const dashboardSyncSub = Sub.watchStore(
    'ListeroDashboard',
    (hostState: any) => {
      const commission = hostState?.model?.commissionRate;
      if (commission !== undefined) {
        log.debug('[DIAGNOSTIC] watchStore detected commissionRate in Host:', commission);
      }
      return {
        userStructureId: hostState?.model?.userStructureId,
        commissionRate: hostState?.model?.commissionRate,
        todayStart: hostState?.model?.todayStart,
        trustedNow: hostState?.model?.trustedNow
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
