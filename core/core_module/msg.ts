
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

  /** Cambio en el estado físico de la red (NetInfo) */
  | { type: 'PHYSICAL_CONNECTION_CHANGED'; payload: boolean }

  /** Cambio en la alcanzabilidad del servidor (ApiClient / Ping) */
  | { type: 'SERVER_REACHABILITY_CHANGED'; payload: boolean }

  /** Mantenimiento del sistema completado (SystemJanitor) */
  | { type: 'MAINTENANCE_COMPLETED'; payload: { date: string; status: 'ready' } }

  /** El contexto de usuario (perfil, estructura) está listo y verificado */
  | { type: 'SESSION_CONTEXT_READY' }

  /** Sistema completamente listo para operar (notificación global) */
  | { type: 'SYSTEM_READY'; payload: { date: string } }

  /** Acción sin efecto (usada para Cmd.task que no necesitan respuesta) */
  | { type: 'NO_OP' }

  /** Trigger para reintento de inicialización */
  | { type: 'RETRY_BOOTSTRAP' };
