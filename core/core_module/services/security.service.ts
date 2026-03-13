import { ValidationResult } from '@core/policies/time-integrity.policy';
import { logger } from '@shared/utils/logger';
import { AuthRepository } from '@shared/repositories/auth';

const log = logger.withTag('SECURITY_SERVICE');

/**
 * SecurityService
 * 
 * Centraliza las decisiones de seguridad y orquestación dentro del CoreModule.
 * Sigue el principio de responsabilidad única - solo maneja decisiones de seguridad técnica.
 */
export class SecurityService {
  private static instance: SecurityService;

  static getInstance(): SecurityService {
    if (!this.instance) {
      this.instance = new SecurityService();
    }
    return this.instance;
  }

  /**
   * Maneja las violaciones de integridad de tiempo decidiendo la respuesta apropiada.
   */
  handleTimeIntegrityViolation(result: ValidationResult): void {
    if (result.status === 'ok') {
      return;
    }

    log.warn('Time integrity violation detected', {
      violationType: result.violationType,
      reason: result.reason,
      jumpMs: result.jumpMs
    });

    // Lógica de decisión centralizada
    if (this.shouldForceLogout(result)) {
      this.forceLogout('TIME_INTEGRITY_VIOLATION', result);
    } else {
      // Para violaciones menores, solo logueamos y continuamos
      log.info('Minor time violation, continuing session', {
        violationType: result.violationType,
        jumpMs: result.jumpMs
      });
    }
  }

  /**
   * Verifica si la sesión está en proceso de salida.
   */
  isLoggingOut(): boolean {
    return AuthRepository.getIsExiting();
  }

  /**
   * Verifica si hay una sesión activa de forma rápida.
   */
  async hasActiveSession(): Promise<boolean> {
    return AuthRepository.hasSession();
  }

  /**
   * Determina si una violación de tiempo debe forzar un logout.
   */
  private shouldForceLogout(result: ValidationResult): boolean {
    if (result.status === 'ok') return false;

    // Si el salto es mayor a 5 minutos (300,000 ms), es crítico
    if (Math.abs(result.jumpMs || 0) > 300000) return true;

    // Si es una desviación grande no categorizada, también es sospechosa
    if (result.violationType === 'large_deviation') return true;

    return false;
  }

  /**
   * Fuerza el logout con una razón y contexto específicos.
   */
  private forceLogout(reason: string, context?: any): void {
    log.info('Forcing logout due to security violation', { reason, context });

    // Delegamos al repositorio de Auth para manejar la expiración de sesión
    try {
      // AuthRepository ya implementa la lógica de notificación a través de sus listeners
      // que son escuchados por el AuthStore y el CoreModule.
      AuthRepository.logout().then(() => {
        log.info('Security logout successful');
      }).catch(err => {
        log.error('Failed to perform security logout', err);
        this.fallbackLogout(reason);
      });
    } catch (error) {
      log.warn('Error accessing AuthRepository for security logout', error);
      this.fallbackLogout(reason);
    }
  }

  /**
   * Fallback logout cuando el repositorio no está disponible o falla.
   */
  private fallbackLogout(reason: string): void {
    try {
      // Notificamos manualmente la expiración para forzar la reacción de los suscriptores
      AuthRepository.notifySessionExpired(reason);
    } catch (error) {
      log.error('Failed to perform fallback logout via AuthRepository', error);
    }
  }
}

export const securityService = SecurityService.getInstance();
