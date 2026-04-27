import {
  StoragePort,
  ClockPort,
  EventBusPort,
  StorageEnvelope,
  QueryResult,
  OfflineStorageVersion,
  StorageKey,
  DomainEventCallback,
  Unsubscribe
} from './types';
import { logger } from '../../utils/logger';

const log = logger.withTag('OFFLINE_STORAGE_CORE');

export interface CoreConfig {
  version: OfflineStorageVersion;
  defaultTTL?: number; // ms
}

/**
 * Motor Agnóstico de Almacenamiento Offline
 */
export class OfflineStorageCore {
  constructor(
    private ports: {
      storage: StoragePort;
      clock: ClockPort;
      events: EventBusPort;
    },
    private readonly config: CoreConfig = { version: 'v2' }
  ) { }

  /**
   * Configura los puertos del motor dinámicamente.
   * Permite inyección de dependencias desde capas superiores (ej. CoreModule).
   */
  configure(ports: Partial<{
    storage: StoragePort;
    clock: ClockPort;
    events: EventBusPort;
  }>): void {
    this.ports = { ...this.ports, ...ports };
    log.info('OfflineStorageCore configured with new ports', {
      hasClock: !!ports.clock,
      hasStorage: !!ports.storage,
      hasEvents: !!ports.events
    });
  }

  /**
   * Guarda un item con metadatos y emite evento
   */
  async set<T>(key: StorageKey, data: T, options?: { ttl?: number }): Promise<void> {
    const envelope: StorageEnvelope<T> = {
      data,
      metadata: {
        version: this.config.version,
        timestamp: this.ports.clock.now(),
        expiresAt: options?.ttl ? this.ports.clock.now() + options.ttl : undefined
      }
    };

    await this.ports.storage.set(key, envelope);

    this.ports.events.publish({
      type: 'ENTITY_CHANGED',
      entity: key,
      payload: data,
      timestamp: envelope.metadata.timestamp
    });
  }

  /**
   * Guarda múltiples items en un solo batch
   */
  async setMulti<T>(entries: { key: StorageKey; data: T; options?: { ttl?: number } }[]): Promise<void> {
    const timestamp = this.ports.clock.now();
    const envelopes: [string, StorageEnvelope<T>][] = entries.map(({ key, data, options }) => [
      key,
      {
        data,
        metadata: {
          version: this.config.version,
          timestamp,
          expiresAt: options?.ttl ? timestamp + options.ttl : undefined
        }
      }
    ]);

    await this.ports.storage.setMulti(envelopes);

    // Emitir eventos individuales para mantener reactividad por entidad
    entries.forEach(({ key, data }) => {
      this.ports.events.publish({
        type: 'ENTITY_CHANGED',
        entity: key,
        payload: data,
        timestamp
      });
    });
  }

  /**
   * Obtiene un item validando su existencia y expiración
   */
  async get<T>(key: StorageKey): Promise<T | null> {
    const envelope = await this.ports.storage.get<StorageEnvelope<T>>(key);

    if (!envelope) return null;

    // Si no tiene metadatos, asumimos que es un formato antiguo o inválido
    if (!envelope.metadata) {
      log.warn(`Key ${key} has no metadata, returning as raw data if possible`, { envelope });
      // Si parece que los datos están en el nivel superior, los devolvemos
      return (envelope as any).data || envelope as unknown as T;
    }

    // Validar expiración
    if (envelope.metadata.expiresAt && envelope.metadata.expiresAt < this.ports.clock.now()) {
      log.info(`Key ${key} expired, removing...`);
      await this.remove(key);
      return null;
    }

    return envelope.data;
  }

  /**
   * Obtiene un item SIN validar expiración.
   * Útil como fallback cuando la red falla y queremos usar cache expirado.
   */
  async getIncludingStale<T>(key: StorageKey): Promise<T | null> {
    const envelope = await this.ports.storage.get<StorageEnvelope<T>>(key);
    if (!envelope) return null;
    if (!envelope.metadata) {
      return (envelope as any).data || envelope as unknown as T;
    }
    return envelope.data;
  }

  /**
   * Obtiene múltiples items validando su existencia y expiración (SSOT)
   */
  async getMulti<T>(keys: StorageKey[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    // Intentar usar el puerto nativo optimizado si existe
    if (this.ports.storage.getMulti) {
      const envelopes = await this.ports.storage.getMulti<StorageEnvelope<T>>(keys);
      const now = this.ports.clock.now();

      return envelopes.map((envelope, index) => {
        if (!envelope) return null;

        // Si no tiene metadatos, asumimos que es un formato antiguo o inválido
        if (!envelope.metadata) {
          return (envelope as any).data || (envelope as unknown as T);
        }

        // Validar expiración (Soft-delete reactivo)
        if (envelope.metadata.expiresAt && envelope.metadata.expiresAt < now) {
          this.remove(keys[index]).catch(() => { }); // Cleanup asíncrono
          return null;
        }

        return envelope.data;
      });
    }

    // Fallback a Promise.all (menos eficiente pero compatible)
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  /**
   * Elimina un item y emite evento
   */
  async remove(key: StorageKey): Promise<void> {
    await this.ports.storage.remove(key);
    this.ports.events.publish({
      type: 'ENTITY_REMOVED',
      entity: key,
      timestamp: this.ports.clock.now()
    });
  }

  /**
   * Elimina múltiples items y emite eventos
   */
  async removeMulti(keys: StorageKey[]): Promise<void> {
    await this.ports.storage.removeMulti(keys);
    const timestamp = this.ports.clock.now();

    keys.forEach(key => {
      this.ports.events.publish({
        type: 'ENTITY_REMOVED',
        entity: key,
        timestamp
      });
    });
  }

  /**
   * Suscribe a eventos del bus global
   */
  subscribe(callback: DomainEventCallback): Unsubscribe {
    return this.ports.events.subscribe(callback);
  }

  /**
   * Crea un objeto de consulta para patrones tipo Redis (ej: "draw:*")
   */
  query<T>(pattern: string): QueryResult<T> {
    const regex = this.patternToRegex(pattern);

    const getMatchedKeys = async () => {
      const allKeys = await this.ports.storage.getAllKeys();
      return allKeys.filter(k => regex.test(k));
    };

    return {
      keys: getMatchedKeys,

      all: async (): Promise<T[]> => {
        const keys = await getMatchedKeys();
        if (keys.length === 0) return [];

        // Optimizamos usando getMulti (SSOT) para evitar cuellos de botella
        const results = await this.getMulti<T>(keys);
        return results.filter((data): data is T => data !== null);
      },

      count: async () => {
        const keys = await getMatchedKeys();
        return keys.length;
      },

      first: async (): Promise<T | null> => {
        const keys = await getMatchedKeys();
        if (keys.length === 0) return null;
        return this.get<T>(keys[0]);
      }
    };
  }

  /**
   * Limpia todas las llaves que coincidan con un patrón
   */
  async clear(pattern: string): Promise<number> {
    const q = this.query(pattern);
    const keys = await q.keys();

    await Promise.all(keys.map(k => this.remove(k)));

    if (keys.length > 0) {
      log.info(`Cleared ${keys.length} keys matching pattern: ${pattern}`);
    }

    return keys.length;
  }

  /**
   * Convierte un patrón glob simple (*, :) a Regex
   */
  private patternToRegex(pattern: string): RegExp {
    // Escapar caracteres especiales de regex excepto *
    let p = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    // Convertir * a .*
    p = p.replace(/\*/g, '.*');
    // Asegurar match exacto
    return new RegExp(`^${p}$`);
  }
}

/**
 * Factory para crear el motor con implementaciones por defecto
 */
export function createOfflineStorage(
  storage: StoragePort,
  events: EventBusPort,
  clock: ClockPort = {
    now: () => Date.now(),
    iso: () => new Date().toISOString()
  }
): OfflineStorageCore {
  return new OfflineStorageCore({ storage, events, clock });
}
