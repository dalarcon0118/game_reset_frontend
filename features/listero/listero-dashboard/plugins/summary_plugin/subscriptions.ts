import { Sub } from '@core/tea-utils';
import { Model } from './model';
import { Msg, GET_FINANCIAL_BETS } from './msg';
import { dashboardService } from '../../services/dashboard.service';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SUMMARY_PLUGIN_SUBSCRIPTIONS');

export const subscriptions = (model: Model) => {
  // Si no tenemos el contexto inicializado o no hay structureId, no podemos suscribirnos aún
  if (!model.context || !model.structureId) {
    return Sub.none();
  }

  return Sub.custom((dispatch) => {
    log.info('Subscribing to DashboardService for financial updates');

    // Suscribirse a la invalidación del Dashboard orquestada por el servicio
    const unsubscribe = dashboardService.onDashboardInvalided(() => {
      log.debug('Dashboard invalidated, triggering financial recalculation');
      dispatch(GET_FINANCIAL_BETS());
    });

    return unsubscribe;
  }, 'summary-dashboard-watch');
};
