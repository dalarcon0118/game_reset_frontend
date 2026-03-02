import { OfflineStorageCore } from './engine';
import { SyncWorkerCore } from './sync/worker';
import { EventBusPort, DomainEvent, DomainEventCallback, Unsubscribe, SYNC_CONSTANTS } from './types';
import storageClient from './storage_client';

/**
 * Implementación del Bus de Eventos para el almacenamiento offline
 */
class OfflineEventBus implements EventBusPort {
  private subscribers = new Set<DomainEventCallback>();

  publish<T>(event: DomainEvent<T>): void {
    this.subscribers.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        console.error('Error in offline event subscriber', e);
      }
    });
  }

  subscribe(callback: DomainEventCallback): Unsubscribe {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

export const offlineEventBus = new OfflineEventBus();

/**
 * Instancia global del motor de almacenamiento offline configurada.
 * Centralizada en core para ser consumida por adaptadores y el worker.
 */
export const offlineStorage = new OfflineStorageCore(
  {
    storage: storageClient,
    clock: {
      now: () => Date.now(),
      iso: () => new Date().toISOString()
    },
    events: offlineEventBus
  },
  { version: 'v2' }
);

/**
 * Instancia global del worker de sincronización.
 */
export const syncWorker = new SyncWorkerCore({
  syncInterval: SYNC_CONSTANTS.DEFAULT_INTERVAL,
  maxRetries: SYNC_CONSTANTS.MAX_RETRIES,
  retryBackoffBase: 5000,
  batchSize: SYNC_CONSTANTS.BATCH_SIZE
});
