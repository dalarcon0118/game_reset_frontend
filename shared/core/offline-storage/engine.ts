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
    private readonly ports: {
      storage: StoragePort;
      clock: ClockPort;
      events: EventBusPort;
    },
    private readonly config: CoreConfig = { version: 'v2' }
  ) { }

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
   * Obtiene un item validando su existencia y expiración
   */
  async get<T>(key: StorageKey): Promise<T | null> {
    const envelope = await this.ports.storage.get<StorageEnvelope<T>>(key);

    if (!envelope) return null;

    // Validar expiración
    if (envelope.metadata.expiresAt && envelope.metadata.expiresAt < this.ports.clock.now()) {
      log.info(`Key ${key} expired, removing...`);
      await this.remove(key);
      return null;
    }

    return envelope.data;
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
        const results: T[] = [];
        for (const key of keys) {
          const data = await this.get<T>(key);
          if (data !== null) results.push(data);
        }
        return results;
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
