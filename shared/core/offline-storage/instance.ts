import { SyncWorkerCore } from './sync/worker';
import { StorageJanitor } from './maintenance/janitor';
import { SYNC_CONSTANTS, STORAGE_TTL } from './types';
import { offlineEventBus } from './event_bus';
console.log('[OFFLINE-INSTANCE] offlineEventBus imported', offlineEventBus);
import { offlineStorage, commonPorts } from './storage';

export { StorageJanitor } from './maintenance/janitor';
export { offlineEventBus };
export { SYNC_CONSTANTS, STORAGE_TTL };
export { offlineStorage };

/**
 * Instancia global del conserje (Janitor) para mantenimiento.
 */
export const offlineJanitor = new StorageJanitor(commonPorts);

/**
 * Instancia global del worker de sincronización.
 */
export const syncWorker = new SyncWorkerCore({
  syncInterval: SYNC_CONSTANTS.DEFAULT_INTERVAL,
  maxRetries: SYNC_CONSTANTS.MAX_RETRIES,
  retryBackoffBase: 5000,
  batchSize: SYNC_CONSTANTS.BATCH_SIZE
});
