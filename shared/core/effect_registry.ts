import { logger } from '../utils/logger';

const log = logger.withTag('EFFECT_REGISTRY');

/**
 * Firma de un manejador de efectos.
 * Recibe un payload tipado y una función de dispatch para enviar mensajes de vuelta al sistema.
 */
export type EffectHandler<T = any> = (payload: T, dispatch: (msg: any) => void) => Promise<void> | void;

/**
 * Interfaz para un módulo de efectos.
 * Un módulo agrupa handlers relacionados bajo un namespace (opcional pero recomendado).
 */
export interface EffectModule {
  namespace?: string;
  handlers: Record<string, EffectHandler>;
}

class EffectRegistryImpl {
  private handlers: Map<string, EffectHandler> = new Map();
  private readonly instanceId: string;

  constructor() {
    this.instanceId = Math.random().toString(36).substring(7);
    log.info(`EffectRegistry initialized [${this.instanceId}]`);
  }

  /**
   * Registra un módulo de efectos en el sistema.
   * @param module El módulo con los handlers a registrar.
   * @param options Opciones de registro (override, etc.)
   */
  register(module: EffectModule, options: { override?: boolean } = {}) {
    const { namespace, handlers } = module;
    const prefix = namespace ? `${namespace}/` : '';

    Object.entries(handlers).forEach(([key, handler]) => {
      const fullKey = `${prefix}${key}`;

      if (this.handlers.has(fullKey) && !options.override) {
        log.warn(`Effect handler collision for key "${fullKey}". Use override: true to replace.`);
        throw new Error(`Effect handler collision: ${fullKey}`);
      }

      this.handlers.set(fullKey, handler);
      log.info(`Registered effect handler: ${fullKey}`);
    });
  }

  /**
   * Obtiene un handler por su clave.
   * @param key La clave del efecto (incluyendo namespace si aplica).
   */
  get(key: string): EffectHandler | undefined {
    return this.handlers.get(key);
  }

  /**
   * Obtiene todas las claves registradas.
   */
  keys(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Despacha un efecto.
   * Esta es la función que usará el Engine para ejecutar los efectos.
   */
  async dispatch(effectKey: string, payload: any, dispatchMsg: (msg: any) => void) {
    const handler = this.get(effectKey);
    if (!handler) {
      log.error(`No handler found for effect: ${effectKey}`);
      // Opcional: Lanzar error o manejar como no-op
      return;
    }

    try {
      await handler(payload, dispatchMsg);
    } catch (error) {
      log.error(`Error executing effect ${effectKey}`, error);
      // Aquí podríamos despachar un mensaje de error genérico si el sistema lo soporta
    }
  }

  /**
   * Limpia todos los handlers (útil para tests).
   */
  clear() {
    this.handlers.clear();
  }
}

export const EffectRegistry = new EffectRegistryImpl();
