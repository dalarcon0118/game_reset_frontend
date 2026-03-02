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
import { offlineEventBus, syncWorker } from '@/shared/core/offline-storage/instance';
import type { Unsubscribe } from '@/shared/core/offline-storage/types';
import { betRepository } from '@/shared/repositories/bet';
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
  // Subscribe to sync events via the global offline event bus
  const syncUnsubscribe = offlineEventBus.subscribe((event) => {
    switch (event.type) {
      case 'SYNC_STARTED':
        dispatch(syncStarted());
        break;

      case 'SYNC_COMPLETED':
        dispatch(syncCompleted({
          succeeded: event.payload?.succeeded || 0,
          failed: event.payload?.failed || 0,
        }));
        break;

      case 'SYNC_ITEM_SUCCESS':
        dispatch(syncItemSuccess({ offlineId: event.payload?.entityId || '' }));
        break;

      case 'SYNC_ITEM_ERROR':
        dispatch(syncItemError({
          offlineId: event.payload?.entityId || '',
          error: event.payload?.error || 'Unknown error'
        }));
        break;

      case 'SYNC_ERROR':
        dispatch(syncError({ error: event.payload?.error || 'Sync error' }));
        break;

      case 'ENTITY_CHANGED':
      case 'ENTITY_REMOVED':
        log.debug('Storage state changed', {
          type: event.type,
          entity: event.entity
        });
        break;
    }
  });

  // Return cleanup function
  return () => {
    syncUnsubscribe();
  };
}

// ============================================================================
// Periodic Stats Loader
// ============================================================================

let statsInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Inicia el polling periódico de estadísticas
 */
export function startStatsPolling(
  dispatch: (msg: OfflineSyncMsg) => void,
  intervalMs: number = 30 * 1000 // 30 segundos para stats
): void {
  if (statsInterval) {
    clearInterval(statsInterval);
  }

  const pollStats = async () => {
    try {
      const stats = syncWorker.getStats();
      const pendingBetsRepo = await betRepository.getPendingBets();

      const pending = pendingBetsRepo.filter(b => b.status === 'pending');
      const syncing = pendingBetsRepo.filter(b => b.status === 'syncing');
      const errors = pendingBetsRepo.filter(b => b.status === 'error');

      dispatch(loadedSyncStats(
        pending.length,
        syncing.length,
        errors.length,
        stats.totalSucceeded,
        stats.status,
        stats.lastRunAt ? Date.now() - stats.lastRunAt : null
      ));

      dispatch(loadedPendingBets(pending.map(b => ({
        id: b.offlineId,
        amount: Number(b.data.amount) || 0,
        timestamp: b.timestamp,
        status: b.status
      }))));

      dispatch(loadedErrorBets(errors.map(b => ({
        id: b.offlineId,
        amount: Number(b.data.amount) || 0,
        timestamp: b.timestamp,
        status: b.status,
        error: 'Sync error'
      }))));

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
}

// ============================================================================
// Cleanup
// ============================================================================

export function cleanupSyncSubscriptions(): void {
  stopStatsPolling();
  syncWorker.stop();
}

// ============================================================================
// Start/Stop Worker
// ============================================================================

/**
 * Inicia el proceso automático periódico (sync worker).
 */
export async function startSyncWorker(): Promise<void> {
  await syncWorker.start();
  startPeriodicSync();
}

export async function stopSyncWorker(): Promise<void> {
  syncWorker.stop();
  // Detener el sync periódico
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export async function forceSyncNow(): Promise<void> {
  await syncWorker.triggerSync();
}
