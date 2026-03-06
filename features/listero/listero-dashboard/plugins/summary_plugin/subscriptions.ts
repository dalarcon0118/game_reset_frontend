import { Sub } from '@/shared/core/tea-utils/sub';
import { Model } from './model';
import { Msg, FETCH_FINANCIAL_SUMMARY } from './msg';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SUMMARY_PLUGIN_SUBSCRIPTIONS');

export const subscriptions = (model: Model) => {
  // Si no tenemos el contexto inicializado o no hay structureId, no podemos suscribirnos aún
  if (!model.context || !model.structureId) {
    return Sub.none();
  }

  return Sub.custom((dispatch) => {
    // Suscribirse a cambios en las apuestas (on-demand desde betRepository)
    // en lugar del ledger separado
    const unsubscribe = offlineEventBus.subscribe((event) => {
      // Escuchar eventos de cambios en apuestas
      if (event.type === 'SYNC_ITEM_SUCCESS' && event.entity === 'bet') {
        log.debug('Bet change detected, triggering financial recalculation', event);
        dispatch(FETCH_FINANCIAL_SUMMARY());
      }

      // También escuchar otros eventos de cambio de entidad
      if (event.type === 'ENTITY_CHANGED' && event.entity?.includes('bet')) {
        log.debug('Entity changed for bets, triggering financial recalculation', event);
        dispatch(FETCH_FINANCIAL_SUMMARY());
      }
    });

    return unsubscribe;
  }, 'summary-bets-watch');
};
