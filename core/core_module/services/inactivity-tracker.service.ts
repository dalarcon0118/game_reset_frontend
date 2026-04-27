import { logger } from '@shared/utils/logger';

const log = logger.withTag('INACTIVITY_TRACKER');
const DEFAULT_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutos

/**
 * InactivityTracker — Single Source of Truth para la actividad del usuario.
 *
 * Responsabilidad única: Rastrear el timestamp de la última actividad
 * del usuario y determinar si ha excedido el umbral de inactividad.
 *
 * Antes: checkInactivityProximity usaba betRepository.getAllRawBets()
 * como proxy de actividad, lo que causaba expiraciones erróneas cuando
 * no había apuestas (SRP violation: bets ≠ user activity).
 *
 * Ahora: Este servicio es el SSOT de "última vez que el usuario estuvo activo",
 * desacoplado de cualquier dominio de negocio.
 */
class InactivityTrackerImpl {
  private lastActivityTimestamp: number = Date.now();
  private thresholdMs: number = DEFAULT_THRESHOLD_MS;

  /**
   * Registra actividad del usuario (touch, navigation, foreground, etc).
   * Resetea el timer de inactividad.
   */
  recordActivity(source: string): void {
    const now = Date.now();
    const elapsedSinceLast = now - this.lastActivityTimestamp;
    this.lastActivityTimestamp = now;
    log.debug(`[INACTIVITY_TRACKER] Activity recorded: ${source}`, {
      elapsedSinceLastMs: elapsedSinceLast,
      thresholdMs: this.thresholdMs
    });
  }

  /**
   * Verifica si el usuario ha estado inactivo más del umbral.
   * Retorna true si debe expirarse la sesión por inactividad.
   */
  isInactive(): boolean {
    const now = Date.now();
    const elapsed = now - this.lastActivityTimestamp;
    return elapsed >= this.thresholdMs;
  }

  /**
   * Retorna el tiempo transcurrido desde la última actividad en ms.
   */
  getElapsedMs(): number {
    return Date.now() - this.lastActivityTimestamp;
  }

  /**
   * Retorna el timestamp de la última actividad.
   */
  getLastActivityTimestamp(): number {
    return this.lastActivityTimestamp;
  }

  /**
   * Configura el umbral de inactividad.
   */
  setThreshold(ms: number): void {
    this.thresholdMs = ms;
    log.info(`[INACTIVITY_TRACKER] Threshold updated: ${ms}ms (${Math.round(ms / 60000)}min)`);
  }

  /**
   * Resetea el tracker (usado después de login exitoso).
   */
  reset(): void {
    this.lastActivityTimestamp = Date.now();
    log.info('[INACTIVITY_TRACKER] Tracker reset (post-login)');
  }
}

export const inactivityTracker = new InactivityTrackerImpl();