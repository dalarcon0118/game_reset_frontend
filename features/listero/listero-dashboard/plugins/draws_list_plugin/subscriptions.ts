import { Model } from './model';
import { Sub } from '@/shared/core/sub';
import { SYNC_STATE, BATCH_OFFLINE_UPDATE } from './msg';
import { logger } from '@/shared/utils/logger';
import { extractHostState, createDrawsHash, HostStatePayload } from './host.adapter';
import { onLedgerChange, financialRepository } from '@/shared/repositories/financial/ledger.repository';

const log = logger.withTag('DRAWS_LIST_PLUGIN_SUBS');

let lastDrawsHash: string | null = null;
let lastPayload: HostStatePayload | null = null;

/**
 * Función helper para obtener los datos del Ledger y transformarlos al formato del plugin
 */
async function fetchLedgerUpdates() {
  const grouped = await financialRepository.getDetailedTotalsGroupedByDrawId();
  const updates = Object.entries(grouped).map(([drawId, data]) => ({
    drawId,
    localAmount: data.net,
    localCredits: data.credits,
    localDebits: data.debits,
    localNetResult: data.net,
    pendingCount: data.count,
  }));
  return updates;
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

    // Nueva suscripción al Ledger Repository
    // Usamos Sub.custom para integrarnos con el sistema de listeners basado en callbacks del Ledger
    Sub.custom((dispatch) => {
      log.info('Subscribing to Ledger changes');

      // 1. Carga inicial de datos del Ledger
      fetchLedgerUpdates().then(updates => {
        if (updates.length > 0) {
          dispatch(BATCH_OFFLINE_UPDATE({ updates }));
        }
      });

      // 2. Suscripción a cambios futuros
      const unsubscribe = onLedgerChange(async () => {
        log.debug('Ledger change detected, refreshing plugin state');
        const updates = await fetchLedgerUpdates();
        dispatch(BATCH_OFFLINE_UPDATE({ updates }));
      });

      return unsubscribe;
    }, 'draws-list-plugin-ledger-sync')
  ]);
};
