
import { SessionStatus } from './model';

export type CoreMsg =
  /** Dispara el proceso de inicialización global (ex-bootstrap.ts) */
  | { type: 'BOOTSTRAP_STARTED' }

  /** Notifica que la inicialización del kernel y servicios base ha terminado */
  | { type: 'BOOTSTRAP_COMPLETED'; payload: SessionStatus }

  /** Error crítico durante la inicialización */
  | { type: 'BOOTSTRAP_FAILED'; payload: string }

  /** Cambio en el estado de la sesión detectado por AuthRepository */
  | { type: 'SESSION_STATUS_CHANGED'; payload: SessionStatus }

  /** Notificación de sesión expirada (401 o TTL excedido) */
  | { type: 'SESSION_EXPIRED'; reason?: string }

  /** Cambio en el estado de red */
  | { type: 'NETWORK_STATUS_CHANGED'; payload: boolean }

  /** Trigger para reintento de inicialización */
  | { type: 'RETRY_BOOTSTRAP' };
