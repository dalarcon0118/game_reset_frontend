import { ValidationResult } from '@/shared/core/policies/time-integrity.policy';
import { logger } from '@/shared/utils/logger';
import { SessionCoordinator } from '@/shared/auth/session/session.coordinator';

const log = logger.withTag('SESSION_SECURITY_COORDINATOR');

/**
 * Centralizes security-related decisions and orchestration.
 * Follows single responsibility principle - only handles security decisions.
 */
export class SessionSecurityCoordinator {
  private static instance: SessionSecurityCoordinator;

  static getInstance(): SessionSecurityCoordinator {
    if (!this.instance) {
      this.instance = new SessionSecurityCoordinator();
    }
    return this.instance;
  }

  /**
   * Handles time integrity violations by deciding appropriate response.
   * This is the centralized place for security decisions.
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

    // Centralized decision logic
    if (this.shouldForceLogout(result)) {
      this.forceLogout('TIME_INTEGRITY_VIOLATION', result);
    } else {
      // For minor violations, just log and continue
      log.info('Minor time violation, continuing session', {
        violationType: result.violationType,
        jumpMs: result.jumpMs
      });
    }
  }

  /**
   * Centralized logic for determining if a violation should force logout.
   * This allows for consistent security policies across the app.
   */
  private shouldForceLogout(result: ValidationResult): boolean {
    if (result.status === 'ok') return false;

    // Don't force logout for small backward jumps (clock corrections)
    if (result.violationType === 'backward_jump' && result.jumpMs && result.jumpMs < 10000) {
      return false;
    }

    // Don't force logout for minor forward jumps during app lifecycle
    if (result.violationType === 'forward_jump' && result.jumpMs && result.jumpMs < 30000) {
      return false;
    }

    // Force logout for significant violations
    return true;
  }

  /**
   * Forces logout with specific reason and context.
   * This provides a single point for logout orchestration.
   */
  private forceLogout(reason: string, context?: any): void {
    log.info('Forcing logout due to security violation', { reason, context });

    // Delegate to session coordinator for actual logout orchestration
    try {
      const sessionCoordinator = SessionCoordinator.getInstance();
      sessionCoordinator.handleSessionExpired(reason);
    } catch (error) {
      // If SessionCoordinator is not initialized, use direct auth store approach
      log.warn('SessionCoordinator not initialized, using fallback logout', error);
      this.fallbackLogout(reason);
    }
  }

  /**
   * Fallback logout when SessionCoordinator is not available.
   */
  private fallbackLogout(reason: string): void {
    try {
      const { useAuthStore } = require('@/features/auth/store/store');
      const authStore = useAuthStore.getState();

      if (authStore?.dispatch) {
        authStore.dispatch({ type: 'SESSION_EXPIRED', reason });
      }
    } catch (error) {
      log.error('Failed to perform fallback logout', error);
    }
  }
}