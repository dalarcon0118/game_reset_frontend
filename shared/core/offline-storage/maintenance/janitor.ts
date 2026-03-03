import { StoragePort, ClockPort, EventBusPort, StorageEnvelope, StorageKey } from '../types';
import { MaintenanceResult, CleanupPredicate, MaintenanceOptions } from './types';
import { logger } from '../../../utils/logger';

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
      // 1. Obtener todas las llaves (o filtrar por patrón si existe)
      let allKeys = await this.ports.storage.getAllKeys();

      if (options.pattern) {
        const regex = this.patternToRegex(options.pattern);
        allKeys = allKeys.filter(k => regex.test(k));
      }

      log.info(`Starting cleanup for ${allKeys.length} keys...`);

      // 2. Iterar sobre llaves y evaluar predicado
      for (const key of allKeys) {
        result.keysProcessed++;

        try {
          const envelope = await this.ports.storage.get<StorageEnvelope<any>>(key);

          // Si no hay sobre o no es un formato válido, ignorar (o registrar si es necesario)
          if (!envelope || !envelope.metadata) continue;

          if (predicate(envelope, key)) {
            await this.ports.storage.remove(key);
            result.keysRemoved++;

            if (!options.silent) {
              this.ports.events.publish({
                type: 'ENTITY_REMOVED',
                entity: key,
                timestamp: this.ports.clock.now()
              });
            }
          }
        } catch (err: any) {
          result.errors.push({ key, error: err.message || 'Unknown error' });
          log.error(`Error processing key during maintenance: ${key}`, err);
        }
      }

      // 3. Emitir evento de fin de mantenimiento
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

  /**
   * Helper para convertir patrón glob simple a Regex (mismo que OfflineStorageCore)
   */
  private patternToRegex(pattern: string): RegExp {
    let p = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    p = p.replace(/\*/g, '.*');
    return new RegExp(`^${p}$`);
  }
}
