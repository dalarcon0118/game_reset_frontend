import { TimePolicy } from '@/shared/repositories/system/time/time.policy';
import { logger } from '@/shared/utils/logger';
import { TimeMetadata } from '@/shared/repositories/system/time/time.types';

const log = logger.withTag('TIME_INTEGRITY_POLICY');

export interface ValidationResult {
  status: 'ok' | 'violation';
  reason?: string;
  violationType?: 'forward_jump' | 'backward_jump' | 'large_deviation';
  jumpMs?: number;
}

export interface TimeIntegrityConfig {
  maxJumpMs: number;
  maxBackwardMs: number;
  maxDeviationMs: number;
}

/**
 * Pure policy for time integrity validation.
 * Follows TEA principles - no side effects, only pure logic.
 */
export class TimeIntegrityPolicy {
  private static readonly DEFAULT_CONFIG: TimeIntegrityConfig = {
    maxJumpMs: 30000, // 30 seconds
    maxBackwardMs: 5000, // 5 seconds
    maxDeviationMs: 60000 // 1 minute
  };

  /**
   * Validates time integrity without side effects.
   * Returns validation result without triggering any actions.
   */
  static validate(
    clientNow: number,
    metadata: TimeMetadata,
    config: Partial<TimeIntegrityConfig> = {}
  ): ValidationResult {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      const result = TimePolicy.evaluateIntegrity(clientNow, metadata, {
        maxJumpMs: finalConfig.maxJumpMs,
        maxBackwardMs: finalConfig.maxBackwardMs
      });

      if (result.status === 'ok') {
        return { status: 'ok' };
      }

      // Map policy result to our validation result
      return {
        status: 'violation',
        reason: result.reason,
        violationType: this.mapViolationType(result.reason),
        jumpMs: result.deltaMs
      };
    } catch (error) {
      log.error('Error during time integrity validation', error);
      return {
        status: 'violation',
        reason: 'Validation error',
        violationType: 'large_deviation'
      };
    }
  }

  /**
   * Determines if a violation should trigger session expiration.
   * This is pure logic - no side effects.
   */
  static shouldForceLogout(result: ValidationResult): boolean {
    if (result.status === 'ok') return false;

    // Don't force logout for small backward jumps (clock corrections)
    if (result.violationType === 'backward_jump' && result.jumpMs && result.jumpMs < 10000) {
      return false;
    }

    // Force logout for significant violations
    return true;
  }

  private static mapViolationType(reason?: string): 'forward_jump' | 'backward_jump' | 'large_deviation' {
    if (!reason) return 'large_deviation';

    if (reason.includes('forward')) return 'forward_jump';
    if (reason.includes('backward')) return 'backward_jump';

    return 'large_deviation';
  }
}