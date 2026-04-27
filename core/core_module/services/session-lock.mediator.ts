import { logger } from '@shared/utils/logger';
import * as Linking from 'expo-linking';

const log = logger.withTag('SESSION_LOCK_MEDIATOR');

/**
 * SessionLockMediator
 *
 * Single authority para garantizar que la app navegue a /login
 * cuando la sesión expira por timeout/inactividad.
 *
 * Responsabilidad única: Coordinar el bloqueo de sesión y
 * garantizar la navegación imperativa (no TEA) como fallback.
 *
 * Flujo:
 * 1. lock(reason) → marca isLocked + notifica AuthRepository (SSOT)
 * 2. AuthRepository emite evento → CoreModule (logout) + AuthModuleV1 (navigate /login)
 * 3. Si al volver a foreground la navegación TEA no se procesó,
 *    forceNavigationToLogin() la ejecuta imperativamente.
 */
class SessionLockMediatorImpl {
  private locked = false;

  /**
   * Bloquea la sesión y notifica al SSOT (AuthRepository).
   * La navegación la maneja AuthModuleV1 vía TEA subscription.
   */
  lock(notifyExpired: (reason: string) => void, reason: string): void {
    if (this.locked) {
      log.info('[SESSION_LOCK] Already locked, skipping duplicate lock', { reason });
      return;
    }

    this.locked = true;
    log.info('[SESSION_LOCK] Session locked', { reason });

    try {
      notifyExpired(reason);
      log.info('[SESSION_LOCK] AuthRepository notified');
    } catch (error) {
      log.error('[SESSION_LOCK] Failed to notify AuthRepository', { error });
      // Fallback: navegación imperativa directa
      this.forceNavigationToLogin();
    }
  }

  /**
   * Navegación imperativa a /login como garantía de último recurso.
   * Se usa cuando el flujo TEA no procesó la navegación
   * (ej: app estaba en background, race condition).
   */
  forceNavigationToLogin(): void {
    if (!this.locked) return;

    log.info('[SESSION_LOCK] Force navigating to /login (imperative)');

    try {
      Linking.openURL('/login');
    } catch (error) {
      log.error('[SESSION_LOCK] Failed to force navigate to /login', { error });
    }
  }

  isSessionLocked(): boolean {
    return this.locked;
  }

  /**
   * Resetea el estado de bloqueo. Se llama después de un login exitoso.
   */
  unlock(): void {
    if (!this.locked) return;
    this.locked = false;
    log.info('[SESSION_LOCK] Session unlocked');
  }
}

export const sessionLockMediator = new SessionLockMediatorImpl();