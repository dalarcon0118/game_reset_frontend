import { logger } from '../../utils/logger';
import { MsgCreator } from './msg';

const log = logger.withTag('SIGNAL_BUS');

export interface GlobalMsg<T = any> {
  readonly type: string;
  readonly payload?: T;
}

type SignalHandler = (payload: any) => void;

class SignalBus {
  private handlers = new Map<string, Set<SignalHandler>>();
  private stickyValues = new Map<string, any>();

  /**
   * Suscribe a un mensaje global usando un MsgCreator para seguridad de tipos.
   */
  subscribe<T extends string, P>(
    signal: MsgCreator<T, P> | string,
    handler: (payload: P) => void
  ): () => void {
    const type = typeof signal === 'string' ? signal : signal.toString();

    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Si hay un valor sticky, notificar inmediatamente al nuevo suscriptor
    if (this.stickyValues.has(type)) {
      const value = this.stickyValues.get(type);
      log.debug(`Delivering sticky value for ${type} to new subscriber`, { value });
      try {
        handler(value);
      } catch (error) {
        log.error(`Error in sticky signal delivery for ${type}`, error);
      }
    }

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  /**
   * Envía un mensaje global a todos los suscriptores.
   */
  send(msg: GlobalMsg, options?: { sticky?: boolean }): void {
    const { type, payload } = msg;

    if (options?.sticky) {
      this.stickyValues.set(type, payload);
    }

    const handlers = this.handlers.get(type);
    if (handlers) {
      log.debug(`Sending global signal: ${type} (sticky: ${!!options?.sticky})`, { payload });
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          log.error(`Error in signal handler for ${type}`, error);
        }
      });
    } else {
      log.debug(`No subscribers for global signal: ${type} (sticky value saved)`);
    }
  }

  /**
   * Limpia el valor sticky de un mensaje.
   */
  clearSticky(signal: MsgCreator<any, any> | string): void {
    const type = typeof signal === 'string' ? signal : signal.toString();
    this.stickyValues.delete(type);
  }
}

export const globalSignalBus = new SignalBus();
