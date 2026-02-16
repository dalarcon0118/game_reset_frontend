/**
 * OfflineSyncPlugin - Subscriptions
 * 
 * Suscripciones a eventos del sync worker y otros efectos secundarios.
 */

import {
  OfflineSyncMsg,
  loadedPendingBets,
  loadedErrorBets,
  loadedSyncStats,
  syncStarted,
  syncCompleted,
  syncItemSuccess,
  syncItemError,
  syncError,
} from './msg';
import { OfflineFinancialService } from '@/shared/services/offline';
import type { Unsubscribe } from '@/shared/services/offline';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('OFFLINE_SYNC_SUBS');

// ============================================================================
// Sync Worker Event Handlers
// ============================================================================

/**
 * Configura suscripciones al sync worker y retorna una función de limpieza.
 */
export function setupSyncWorkerSubscriptions(
  dispatch: (msg: OfflineSyncMsg) => void
): () => void {
  let unsubscribes: Unsubscribe[] = [];

  // Subscribe to sync events
  const syncUnsubscribe = OfflineFinancialService.onSyncEvent((event) => {
    switch (event.type) {
      case 'started':
        dispatch(syncStarted());
        break;

      case 'completed':
        dispatch(syncCompleted({
          succeeded: event.result?.succeeded || 0,
          failed: event.result?.failed || 0,
        }));
        break;

      case 'item_success':
        dispatch(syncItemSuccess({ offlineId: event.itemId! }));
        break;

      case 'item_error':
        dispatch(syncItemError({
          offlineId: event.itemId!,
          error: event.error || 'Unknown error'
        }));
        break;

      case 'error':
        dispatch(syncError({ error: event.error || 'Sync error' }));
        break;
    }
  });

  unsubscribes.push(syncUnsubscribe);

  // Subscribe to state changes
  const stateUnsubscribe = OfflineFinancialService.onAnyStateChange((event) => {
    log.debug('State changed', { changeType: event.changeType });
  });

  unsubscribes.push(stateUnsubscribe);

  // Return cleanup function
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

// ============================================================================
// Periodic Stats Loader
// ============================================================================

let statsInterval: ReturnType<typeof setInterval> | null = null;
let syncInterval: ReturnType<typeof setInterval> | null = null;

/** Intervalo de sync automático: 5 minutos */
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 300000ms

/**
 * Inicia el polling periódico de estadísticas
 */
export function startStatsPolling(
  dispatch: (msg: OfflineSyncMsg) => void,
  intervalMs: number = 30000 // 30 segundos para stats
): void {
  if (statsInterval) {
    clearInterval(statsInterval);
  }

  const pollStats = async () => {
    try {
      const stats = await OfflineFinancialService.getSyncStats();

      dispatch(loadedSyncStats(
        stats.pendingBets,
        stats.syncingBets,
        stats.errorBets,
        stats.syncedToday,
        stats.workerStatus,
        stats.timeSinceLastSync ? Date.now() - stats.timeSinceLastSync : null
      ));

      // Also load pending/error bets
      const pendingBets = await OfflineFinancialService.getPendingBets();
      const pending = pendingBets.filter(b => b.status === 'pending');
      const errors = pendingBets.filter(b => b.status === 'error');

      dispatch(loadedPendingBets(pending));
      dispatch(loadedErrorBets(errors));

    } catch (error) {
      log.error('Error polling stats', error);
    }
  };

  // Initial poll
  pollStats();

  // Set interval
  statsInterval = setInterval(pollStats, intervalMs);
}

/**
 * Detiene el polling de estadísticas
 */
export function stopStatsPolling(): void {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// ============================================================================
// Cleanup
// ============================================================================

export function cleanupSyncSubscriptions(): void {
  stopStatsPolling();
  OfflineFinancialService.stopSyncWorker();
}

// ============================================================================
// Periodic Background Sync (cada 5 minutos)
// ============================================================================

/**
 * Inicia el sync automático periódico en background.
 */
export function startPeriodicSync(): () => void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  log.info(`Starting periodic sync every ${SYNC_INTERVAL_MS / 1000 / 60} minutes`);

  const initialSync = async () => {
    try {
      const stats = await OfflineFinancialService.getSyncStats();
      if (stats.pendingBets > 0) {
        await OfflineFinancialService.syncNow();
      }
    } catch (error) {
      log.error('Initial sync error', error);
    }
  };

  initialSync();
  syncInterval = setInterval(initialSync, SYNC_INTERVAL_MS);

  return () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };
}

// ============================================================================
// Start/Stop Worker
// ============================================================================

/**
 * Inicia el proceso automático periódico (sync worker).
 */
export async function startSyncWorker(): Promise<void> {
  await OfflineFinancialService.startSyncWorker();
  startPeriodicSync();
}

export async function stopSyncWorker(): Promise<void> {
  await OfflineFinancialService.stopSyncWorker();
  // Detener el sync periódico
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export async function forceSyncNow(): Promise<void> {
  await OfflineFinancialService.syncNow();
}
