import { TeaMiddleware } from '@core/tea-utils/middleware.types';
import { TimerRepository } from '@/shared/repositories/system/time';
import { ValidationResult } from '@/shared/core/policies/time-integrity.policy';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TIME_INTEGRITY_MW');

/**
 * Interface for the Security Coordinator required by the middleware.
 * This prevents direct coupling to a specific implementation.
 */
export interface TimeIntegritySecurityCoordinator {
    isLoggingOut: () => boolean;
    hasActiveSession: () => Promise<boolean>;
    handleViolation: (result: ValidationResult) => void;
}

/**
 * Middleware that validates time integrity before any state update.
 * If fraud is detected, it triggers a global session expiration.
 * 
 * ARCHITECTURE: Follows Dependency Injection (DI) to remain pure and decoupled.
 */
export const createTimeIntegrityMiddleware = (
    coordinator: TimeIntegritySecurityCoordinator
): TeaMiddleware<any, any> => {
    // Local cache for the current transaction ID to avoid redundant validations
    let lastProcessedTraceId: string | null = null;

    return {
        id: 'time-integrity',

        beforeUpdate: async (model, msg, meta) => {
            // 1. TraceID Deduplication
            if (meta.traceId && meta.traceId === lastProcessedTraceId) {
                return;
            }
            lastProcessedTraceId = meta.traceId;

            // 2. Auth Guards
            const msgType = (msg as any).type;
            if (
                msgType === 'SESSION_EXPIRED' ||
                msgType === 'LOGOUT_REQUESTED' ||
                msgType === 'SESSION_CHANGED' ||
                msgType?.startsWith('LOGIN_')
            ) {
                return;
            }

            try {
                // Check if we are already in logout process to avoid loops
                if (coordinator.isLoggingOut()) {
                    log.debug('Skipping time integrity validation - logout in progress');
                    return;
                }

                // Check if we have an active session
                const hasSession = await coordinator.hasActiveSession();
                if (!hasSession) {
                    log.debug('Skipping time integrity validation - no active session');
                    return;
                }

                const result = await TimerRepository.validateIntegrity(Date.now());

                if (result.status !== 'ok') {
                    log.error('TIME FRAUD DETECTED', {
                        status: result.status,
                        reason: result.reason,
                        msgType
                    }, 'BUSINESS', 'HIGH');

                    // Force session expiration via Coordinator
                    coordinator.handleViolation({
                        status: 'violation',
                        reason: result.reason || 'Time fraud detected',
                        violationType: result.status === 'backward' ? 'backward_jump' : 'forward_jump'
                    });
                }
            } catch (error) {
                log.error('Error during time integrity validation', error);
            }
        }
    };
};
