import { OfflineStorageCore } from './engine';
import { SyncWorkerCore } from './sync/worker';
import { StorageJanitor } from './maintenance/janitor';
import { EventBusPort, DomainEvent, DomainEventCallback, Unsubscribe, SYNC_CONSTANTS, STORAGE_TTL } from './types';
import storageClient from './storage_client';
import { offlineEventBus } from './event_bus';

export { StorageJanitor } from './maintenance/janitor';
export { offlineEventBus };
export { SYNC_CONSTANTS, STORAGE_TTL };

/**
 * Puertos compartidos
 */
const commonPorts = {
  storage: storageClient,
  clock: {
    now: () => Date.now(),
    iso: () => new Date().toISOString()
  },
  events: offlineEventBus
};

/**
 * Instancia global del motor de almacenamiento offline configurada.
 * Centralizada en core para ser consumida por adaptadores y el worker.
 */
export const offlineStorage = new OfflineStorageCore(
  commonPorts,
  { version: 'v2' }
);

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
