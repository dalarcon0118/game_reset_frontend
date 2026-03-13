import { StoreApi } from 'zustand';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('STORE_REGISTRY');

/**
 * Registro centralizado para instancias de stores TEA.
 * Permite que el motor y otras utilidades encuentren stores activos
 * fuera del ciclo de vida de React (ej: en suscripciones globales).
 */
class StoreRegistry {
  private stores = new Map<string, StoreApi<any>>();

  /**
   * Registra una instancia de store.
   * @param id Identificador único del store (ej: 'AuthModuleV1')
   * @param store Instancia de Zustand StoreApi
   */
  register(id: string, store: StoreApi<any>): void {
    if (this.stores.has(id)) {
      log.warn(`Store with id "${id}" is already registered. Overwriting.`);
    }
    this.stores.set(id, store);
    log.debug(`Registered store: ${id}`);
  }

  /**
   * Desregistra una instancia de store.
   */
  unregister(id: string): void {
    if (this.stores.delete(id)) {
      log.debug(`Unregistered store: ${id}`);
    }
  }

  /**
   * Obtiene una instancia de store por su ID.
   */
  get<T>(id: string): StoreApi<T> | undefined {
    return this.stores.get(id) as StoreApi<T> | undefined;
  }

  /**
   * Verifica si un store está registrado.
   */
  has(id: string): boolean {
    return this.stores.has(id);
  }

  /**
   * Retorna todos los IDs registrados.
   */
  getIds(): string[] {
    return Array.from(this.stores.keys());
  }
}

export const storeRegistry = new StoreRegistry();
