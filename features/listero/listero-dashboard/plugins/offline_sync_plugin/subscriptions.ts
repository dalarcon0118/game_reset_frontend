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
import { SYNC_CONSTANTS } from '@/shared/core/offline-storage/types';
import { betRepository } from '@/shared/repositories/bet';
import { OfflineSyncReadModelService, OfflineSyncBetView } from '@/shared/repositories/bet/offline-sync.read-model.service';
import { logger } from '@/shared/utils/logger';
import type { OfflineSyncBet } from './types';

const log = logger.withTag('OFFLINE_SYNC_SUBS');

/**
 * Maps repository view to local UI DTO
 */
function mapToUIDTO(view: OfflineSyncBetView): OfflineSyncBet {
  return {
    id: view.offlineId,
    amount: view.amount,
    timestamp: view.timestamp,
    status: view.status,
    error: view.lastError,
  };
}

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
      const rawBets = await betRepository.getPendingBets();
      const splitBets = OfflineSyncReadModelService.splitBets(rawBets);
      const statsView = OfflineSyncReadModelService.buildStats(rawBets);

      dispatch(loadedSyncStats({
        pendingCount: statsView.pendingCount,
        syncingCount: statsView.syncingCount,
        errorCount: statsView.errorCount,
        syncedToday: stats.totalSucceeded,
        workerStatus: OfflineSyncReadModelService.normalizeWorkerStatus(stats.status),
        lastSyncAt: stats.lastRunAt
      }));

      dispatch(loadedPendingBets(splitBets.pending.map(mapToUIDTO)));
      dispatch(loadedErrorBets(splitBets.error.map(mapToUIDTO)));

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
// Periodic Sync
// ============================================================================

let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Inicia el proceso de sincronización periódica
 */
export function startPeriodicSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  const intervalMs = SYNC_CONSTANTS?.DEFAULT_INTERVAL || 60 * 1000; // Default 1 minuto

  // Función de sincronización
  const runPeriodicSync = async () => {
    try {
      await syncWorker.triggerSync();
    } catch (error) {
      log.error('Periodic sync failed', error);
    }
  };

  // Ejecutar inmediatamente y luego periódicamente
  runPeriodicSync();
  syncInterval = setInterval(runPeriodicSync, intervalMs);

  log.info(`Periodic sync started with interval: ${intervalMs}ms`);
}

// ============================================================================
// Cleanup
// ============================================================================

export function cleanupSyncSubscriptions(): void {
  stopStatsPolling();
  stopSyncWorker();
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
