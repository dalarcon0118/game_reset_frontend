import { logger } from '../../utils/logger';

const log = logger.withTag('SIGNAL_BUS');

export interface GlobalMsg<T = any> {
  readonly type: string;
  readonly payload?: T;
}

type SignalHandler = (payload: any) => void;

class SignalBus {
  private handlers = new Map<string, Set<SignalHandler>>();

  /**
   * Suscribe a un mensaje global.
   * @param type El tipo de mensaje a escuchar.
   * @param handler La función que recibirá el payload.
   * @returns Una función para cancelar la suscripción.
   */
  subscribe(type: string, handler: SignalHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

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
   * @param msg El mensaje global estructurado.
   */
  send(msg: GlobalMsg): void {
    const { type, payload } = msg;
    const handlers = this.handlers.get(type);
    if (handlers) {
      log.debug(`Sending global signal: ${type}`, { payload });
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          log.error(`Error in signal handler for ${type}`, error);
        }
      });
    } else {
      log.debug(`No subscribers for global signal: ${type}`);
    }
  }
}

export const globalSignalBus = new SignalBus();
