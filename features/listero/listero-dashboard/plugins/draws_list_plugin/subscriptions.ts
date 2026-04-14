import { Model } from './model';
import { Sub } from '@core/tea-utils';
import { SYNC_STATE, BATCH_OFFLINE_UPDATE, DrawTotalsUpdate } from './msg';
import { logger } from '@/shared/utils/logger';
import { extractHostState, createDrawsHash, HostStatePayload } from './host.adapter';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { TimerRepository } from '@/shared/repositories/system/time';
import { dashboardService } from '../../services/dashboard.service';

const log = logger.withTag('DRAWS_LIST_PLUGIN_SUBS');

// Variables de control encapsuladas en el closure del módulo pero reseteables
let lastDrawsHash: string | null = null;
let lastPayload: HostStatePayload | null = null;
let lastHostStatus: string | null = null;

/**
 * Resetea el estado de sincronización. Útil al re-montar el dashboard.
 */
export const resetSyncState = () => {
  log.info('Resetting draws_list_plugin sync state');
  lastDrawsHash = null;
  lastPayload = null;
  lastHostStatus = null;
};

/**
 * Función helper para obtener los datos financieros de las apuestas y transformarlos al formato del plugin
 * Ahora usa cálculo on-demand desde BetRepository en lugar del Ledger
 */
async function fetchBetTotalsByDrawId(commissionRate: number, structureId?: string): Promise<DrawTotalsUpdate[]> {
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
    todayStart,
    commissionRate,
    structureId
  });

  // Obtener totales por drawId desde BetRepository (cálculo on-demand)
  const totalsByDrawId = await betRepository.getTotalsByDrawId(todayStart, structureId, commissionRate);

  const entries = Object.entries(totalsByDrawId);
  log.debug('Financial totals intermediate', {
    drawsRead: entries.length
  });

  const updates = entries.map(([drawId, data]) => ({
    drawId,
    totalCollected: data.totalCollected,
    premiumsPaid: 0, // No disponible en RawBetTotals (SSOT de BetRepository)
    netResult: data.netResult, // Ahora calculado en BetRepository (Ventas - Comisiones)
    betCount: data.betCount,
  }));

  log.debug('Financial totals final', {
    drawCount: updates.length,
    totalsCount: updates.reduce((acc, item) => acc + item.betCount, 0)
  });

  return updates;
}

async function recomputeAndDispatchFinancialTotals(
  dispatch: (msg: ReturnType<typeof BATCH_OFFLINE_UPDATE>) => void,
  hostStore: any
): Promise<void> {
  try {
    const hostState = hostStore.getState();
    const hostModel = hostState.model || hostState;
    const commissionRate = hostModel.commissionRate || 0;
    const structureId = hostModel.userStructureId || undefined;
    const updates = await fetchBetTotalsByDrawId(commissionRate, structureId);
    const timestamp = await TimerRepository.getTrustedNow(Date.now());
    dispatch(BATCH_OFFLINE_UPDATE({ updates, timestamp }));
  } catch (error) {
    log.error('Failed to recalculate financial totals', error);
  }
}

export const subscriptions = (model: Model) => {
  // DEBUG: Only log when subscriptions are actually being set up (first time or when IDs change)
  //log.debug('Setting up draws_list_plugin subscriptions', { hasContext: !!model.context, hasHostStore: !!model.context?.hostStore });

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
    // Esta suscripción lee directamente del store del dashboard
    // El problema de timing se resuelve forzando sync cuando el dashboard está READY
    Sub.watchStore(
      model.context.hostStore,
      (state: any) => {
        // Use adapter to extract and validate state
        const currentPayload = extractHostState(state, model.config);

        // DEBUG: Log store state changes
        log.debug('Host Store watched', {
          drawsType: currentPayload.draws?.type,
          drawsCount: currentPayload.draws?.type === 'Success' ? currentPayload.draws?.data?.length : 0,
          status: state.status?.type
        });

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

        // 🛡️ Lógica de sincronización simplificada:
        // El plugin propaga el estado del host. Si el plugin NO tiene datos,
        // siempre sincronizamos (primera carga). De lo contrario, solo si cambiaron.
        
        const hostStatus = state.status?.type;
        const hostHasData = currentPayload.draws.type === 'Success';
        const hostIsLoading = currentPayload.draws.type === 'Loading';
        const pluginHasNoData = !lastPayload || lastPayload.draws.type !== 'Success';
        const dataChanged = currentHash !== lastDrawsHash;
        
        // SIEMPRE sincronizar si el plugin no tiene datos (primera carga sin cache local)
        // NO bloquear por hostIsLoading en este caso - el plugin necesita recibir Loading para mostrar estado
        const shouldSync = pluginHasNoData || (!hostIsLoading && dataChanged);
        
        if (!shouldSync) {
          log.debug('Skipping sync - no relevant changes', {
            hostStatus,
            pluginHasNoData,
            hostIsLoading,
            dataChanged
          });
          return lastPayload;
        }

        log.info('Syncing Plugin State', {
          drawsState: currentPayload.draws.type,
          drawsCount: currentPayload.draws.type === 'Success' ? currentPayload.draws.data.length : 0,
          reason: pluginHasNoData ? 'first sync (no local data)' : 'data changed'
        });

        lastDrawsHash = currentHash;
        lastPayload = currentPayload;
        return currentPayload;
      },
      (payload) => SYNC_STATE(payload),
      'draws-list-plugin-sync'
    ),

    // Suscripción a invalidaciones del servicio (Dashboard Refresh)
    Sub.custom((dispatch) => {
      log.info('Subscribing to DashboardService for Bet totals');

      const hostStore = model.context?.hostStore;
      if (!hostStore) {
        return () => { };
      }

      recomputeAndDispatchFinancialTotals(dispatch, hostStore);

      const unsubscribe = dashboardService.onDashboardInvalided(() => {
        log.info('🔄 DRAWS_LIST_PLUGIN: Refreshing draws and totals due to Dashboard Invalidation');

        const currentHostStore = model.context?.hostStore;
        if (currentHostStore) {
          const hostState = currentHostStore.getState();
          const currentPayload = extractHostState(hostState, model.config);
          log.info('SYNC_STATE from invalidation', { drawsType: currentPayload.draws.type });
          dispatch(SYNC_STATE(currentPayload));
        }

        recomputeAndDispatchFinancialTotals(dispatch, currentHostStore || hostStore);
      });

      return () => {
        unsubscribe();
        log.debug('Bet totals subscription cleanup');
      };
    }, 'draws-list-dashboard-watch')
  ]);
};
