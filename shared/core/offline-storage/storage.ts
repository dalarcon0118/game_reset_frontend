import { OfflineStorageCore } from './engine';
import storageClient from './storage_client';
import { offlineEventBus } from './event_bus';

/**
 * Puertos compartidos
 */
export const commonPorts = {
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
