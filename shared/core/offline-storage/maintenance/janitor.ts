import { StoragePort, ClockPort, EventBusPort, StorageEnvelope, StorageKey } from '../types';
import { MaintenanceResult, CleanupPredicate, MaintenanceOptions } from './types';
import { logger } from '../../../utils/logger';
import { batchProcess } from '../../../utils/generators';

const log = logger.withTag('STORAGE_JANITOR');

/**
 * Orquestador de mantenimiento y limpieza (Janitor)
 * Encargado de recorrer el almacenamiento y aplicar criterios de eliminación.
 */
export class StorageJanitor {
  constructor(
    private readonly ports: {
      storage: StoragePort;
      clock: ClockPort;
      events: EventBusPort;
    }
  ) { }

  /**
   * Ejecuta la limpieza basada en uno o más predicados.
   * @param predicate Criterio de eliminación
   * @param options Opciones de ejecución (ej: patrón de llaves)
   */
  async clean(
    predicate: CleanupPredicate,
    options: MaintenanceOptions = {}
  ): Promise<MaintenanceResult> {
    const result: MaintenanceResult = {
      keysProcessed: 0,
      keysRemoved: 0,
      errors: []
    };

    try {
      log.info('Starting cleanup...');
      const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : 50;
      const keyStream = this.createKeyStream(options.pattern);
      const removableKeys = this.iterateRemovableKeys(keyStream, predicate, result, batchSize);

      for await (const batch of batchProcess(removableKeys, batchSize)) {
        await this.removeBatch(batch, options, result);
      }

      this.ports.events.publish({
        type: 'MAINTENANCE_COMPLETED',
        entity: 'storage',
        payload: {
          removed: result.keysRemoved,
          processed: result.keysProcessed,
          errors: result.errors.length
        },
        timestamp: this.ports.clock.now()
      });

      log.info(`Maintenance finished. Removed: ${result.keysRemoved}/${result.keysProcessed}`);

    } catch (err: any) {
      log.error('Critical error during storage maintenance', err);
      throw err;
    }

    return result;
  }

  private createKeyStream(pattern?: string): AsyncGenerator<StorageKey, void, unknown> {
    if (this.ports.storage.iterateKeys) {
      return this.ports.storage.iterateKeys(pattern);
    }
    return this.iterateKeysFromAllKeys(pattern);
  }

  private async *iterateKeysFromAllKeys(pattern?: string): AsyncGenerator<StorageKey> {
    const allKeys = await this.ports.storage.getAllKeys();
    if (!pattern) {
      for (const key of allKeys) {
        yield key;
      }
      return;
    }

    const regex = this.patternToRegex(pattern);
    for (const key of allKeys) {
      if (regex.test(key)) {
        yield key;
      }
    }
  }

  private async *iterateRemovableKeys(
    keyStream: AsyncGenerator<StorageKey, void, unknown>,
    predicate: CleanupPredicate,
    result: MaintenanceResult,
    batchSize: number
  ): AsyncGenerator<StorageKey> {
    const getMulti = this.ports.storage.getMulti;
    if (getMulti) {
      yield* this.iterateRemovableKeysWithGetMulti(keyStream, predicate, result, batchSize, getMulti.bind(this.ports.storage));
      return;
    }

    for await (const key of keyStream) {
      yield* this.evaluateSingleKey(key, predicate, result);
    }
  }

  private async *iterateRemovableKeysWithGetMulti(
    keyStream: AsyncGenerator<StorageKey, void, unknown>,
    predicate: CleanupPredicate,
    result: MaintenanceResult,
    batchSize: number,
    getMulti: <T>(keys: string[]) => Promise<(T | null)[]>
  ): AsyncGenerator<StorageKey> {
    for await (const keyBatch of batchProcess(keyStream, batchSize)) {
      result.keysProcessed += keyBatch.length;
      try {
        const envelopes = await getMulti<StorageEnvelope<any>>(keyBatch);
        for (let idx = 0; idx < keyBatch.length; idx++) {
          const key = keyBatch[idx];
          const envelope = envelopes[idx];
          if (!envelope || !envelope.metadata) continue;
          if (predicate(envelope, key)) {
            yield key;
          }
        }
      } catch (batchErr: any) {
        log.error('Error processing batch during maintenance', batchErr);
        for (const key of keyBatch) {
          yield* this.evaluateSingleKeyWithoutCount(key, predicate, result);
        }
      }
    }
  }

  private async *evaluateSingleKey(
    key: StorageKey,
    predicate: CleanupPredicate,
    result: MaintenanceResult
  ): AsyncGenerator<StorageKey> {
    result.keysProcessed++;
    yield* this.evaluateSingleKeyWithoutCount(key, predicate, result);
  }

  private async *evaluateSingleKeyWithoutCount(
    key: StorageKey,
    predicate: CleanupPredicate,
    result: MaintenanceResult
  ): AsyncGenerator<StorageKey> {
    try {
      const envelope = await this.ports.storage.get<StorageEnvelope<any>>(key);
      if (!envelope || !envelope.metadata) return;
      if (predicate(envelope, key)) {
        yield key;
      }
    } catch (err: any) {
      result.errors.push({ key, error: err.message || 'Unknown error' });
      log.error(`Error processing key during maintenance: ${key}`, err);
    }
  }

  private async removeBatch(
    keys: StorageKey[],
    options: MaintenanceOptions,
    result: MaintenanceResult
  ): Promise<void> {
    if (keys.length === 0) return;

    try {
      await this.ports.storage.removeMulti(keys);
      result.keysRemoved += keys.length;
      if (!options.silent) {
        for (const key of keys) {
          this.ports.events.publish({
            type: 'ENTITY_REMOVED',
            entity: key,
            timestamp: this.ports.clock.now()
          });
        }
      }
    } catch (batchErr: any) {
      log.error('Error removing batch during maintenance', batchErr);
      for (const key of keys) {
        try {
          await this.ports.storage.remove(key);
          result.keysRemoved++;
          if (!options.silent) {
            this.ports.events.publish({
              type: 'ENTITY_REMOVED',
              entity: key,
              timestamp: this.ports.clock.now()
            });
          }
        } catch (err: any) {
          result.errors.push({ key, error: err.message || 'Unknown error' });
          log.error(`Error removing key during maintenance: ${key}`, err);
        }
      }
    }
  }

  /**
   * Helper para convertir patrón glob simple a Regex (mismo que OfflineStorageCore)
   */
  private patternToRegex(pattern: string): RegExp {
    let p = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    p = p.replace(/\*/g, '.*');
    return new RegExp(`^${p}$`);
  }
}
