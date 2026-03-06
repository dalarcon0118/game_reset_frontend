import { Model } from './model';
import { Sub } from '@/shared/core/tea-utils/sub';
import { SYNC_STATE, BATCH_OFFLINE_UPDATE, DrawTotalsUpdate } from './msg';
import { logger } from '@/shared/utils/logger';
import { extractHostState, createDrawsHash, HostStatePayload } from './host.adapter';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { TimerRepository } from '@/shared/repositories/system/time/timer.repository';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';

const log = logger.withTag('DRAWS_LIST_PLUGIN_SUBS');

let lastDrawsHash: string | null = null;
let lastPayload: HostStatePayload | null = null;

/**
 * Función helper para obtener los datos financieros de las apuestas y transformarlos al formato del plugin
 * Ahora usa cálculo on-demand desde BetRepository en lugar del Ledger
 */
async function fetchBetTotalsByDrawId(): Promise<DrawTotalsUpdate[]> {
  // Obtener hora confiable del servidor
  const trustedNow = await TimerRepository.getTrustedNow(Date.now());
  const trustedDate = new Date(trustedNow);
  const todayStart = new Date(
    trustedDate.getFullYear(),
    trustedDate.getMonth(),
    trustedDate.getDate()
  ).getTime();

  log.debug('Financial totals input', {
    trustedNow,
    todayStart
  });

  // Obtener totales por drawId desde BetRepository (cálculo on-demand)
  const totalsByDrawId = await betRepository.getTotalsByDrawId(todayStart);

  const entries = Object.entries(totalsByDrawId);
  log.debug('Financial totals intermediate', {
    drawsRead: entries.length
  });

  const updates = entries.map(([drawId, data]) => ({
    drawId,
    totalCollected: data.totalCollected,
    premiumsPaid: data.premiumsPaid,
    netResult: data.netResult,
    betCount: data.betCount,
  }));

  log.debug('Financial totals final', {
    drawCount: updates.length,
    totalsCount: updates.reduce((acc, item) => acc + item.betCount, 0)
  });

  return updates;
}

async function recomputeAndDispatchFinancialTotals(dispatch: (msg: ReturnType<typeof BATCH_OFFLINE_UPDATE>) => void): Promise<void> {
  try {
    const updates = await fetchBetTotalsByDrawId();
    dispatch(BATCH_OFFLINE_UPDATE({ updates }));
  } catch (error) {
    log.error('Failed to recalculate financial totals', error);
  }
}

export const subscriptions = (model: Model) => {
  // Validación de entradas: Asegurar que el contexto y hostStore existen antes de suscribirse
  if (!model.context) {
    log.debug('Subscription skipped: No context');
    return Sub.none();
  }

  if (!model.context.hostStore) {
    log.warn('Subscription skipped: Context exists but hostStore is missing', {
      contextKeys: Object.keys(model.context)
    });
    return Sub.none();
  }

  return Sub.batch([
    // Suscripción principal al host store
    Sub.watchStore(
      model.context.hostStore,
      (state: any) => {
        // Use adapter to extract and validate state
        const currentPayload = extractHostState(state, model.config);

        // Calculate hash for change detection
        const currentHash = createDrawsHash(
          currentPayload.draws,
          currentPayload.filter,
          currentPayload.summary
        );

        log.debug('Host Store Update Check', {
          drawsState: currentPayload.draws.type,
          hasData: currentPayload.draws.type === 'Success',
          currentHash,
          lastHash: lastDrawsHash,
          isEqual: currentHash === lastDrawsHash
        });

        // Si el hash es el mismo que el último procesado, retornamos el último payload
        // para que la comparación por referencia en el engine detenga la propagación.
        if (currentHash === lastDrawsHash && lastPayload) {
          return lastPayload;
        }

        log.info('Syncing Plugin State', {
          drawsState: currentPayload.draws.type,
          drawsCount: currentPayload.draws.type === 'Success' ? currentPayload.draws.data.length : 0
        });

        lastDrawsHash = currentHash;
        lastPayload = currentPayload;
        return currentPayload;
      },
      (payload) => SYNC_STATE(payload),
      'draws-list-plugin-sync'
    ),

    // Nueva suscripción para calcular totales financieros on-demand desde BetRepository
    // Reemplaza la suscripción anterior al Ledger
    Sub.custom((dispatch) => {
      log.info('Subscribing to Bet totals (on-demand calculation)');

      recomputeAndDispatchFinancialTotals(dispatch);

      const unsubscribe = offlineEventBus.subscribe((event) => {
        const isBetSyncSuccess = event.type === 'SYNC_ITEM_SUCCESS' && event.entity === 'bet';
        const isBetEntityChanged = event.type === 'ENTITY_CHANGED' && event.entity?.includes('bet');
        if (!isBetSyncSuccess && !isBetEntityChanged) {
          return;
        }

        log.debug('Financial totals trigger event', {
          type: event.type,
          entity: event.entity
        });

        recomputeAndDispatchFinancialTotals(dispatch);
      });

      return () => {
        unsubscribe();
        log.debug('Bet totals subscription cleanup');
      };
    }, 'draws-list-plugin-bet-totals-sync')
  ]);
};
