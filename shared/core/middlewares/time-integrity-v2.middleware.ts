import { TeaMiddleware } from '@/shared/core/tea-utils/middleware.types';
import { TimerRepository } from '@/shared/repositories/system/time/timer.repository';
import { AuthMsgType } from '@/features/auth/store/types/messages.types';
import { logger } from '@/shared/utils/logger';
import { ValidationResult } from '@/shared/core/policies/time-integrity.policy';
import { SessionSecurityCoordinator } from '@/shared/core/coordinators/session-security.coordinator';

const log = logger.withTag('TIME_INTEGRITY_MW_V2');

/**
 * Pure TEA middleware for time integrity validation.
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. No side effects in beforeUpdate - only validation
 * 2. Uses meta object to pass violation data to afterUpdate
 * 3. Delegates security decisions to SessionSecurityCoordinator
 * 4. Respects TEA purity by avoiding direct store access
 * 
 * This solves the infinite loop issue by:
 * - Not dispatching messages from within the middleware
 * - Using meta object to communicate violations
 * - Centralizing security decisions
 */
export interface TimeIntegrityMeta {
    timeIntegrityViolation?: ValidationResult;
    timeIntegrityChecked?: boolean;
}

const BET_COMMIT_MSG_TYPES = [
    'CONFIRM_SAVE_BETS',
    'CONFIRM_SAVE_ALL_BETS',
    'SAVE_ALL_BETS',
    'SAVE_BETS_REQUESTED',
    'SAVE_BETS'
];

const getMsgType = (msg: any): string | undefined => {
    if (!msg) return undefined;
    return msg.payload?.type || msg.type;
};

const isBetCommitMessage = (msg: any): boolean => {
    const msgType = getMsgType(msg);
    return !!msgType && BET_COMMIT_MSG_TYPES.some((type) => msgType === type);
};

const toValidationResult = (status: 'backward' | 'jump', reason?: string, deltaMs?: number): ValidationResult => {
    return {
        status: 'violation',
        reason: reason || 'Time integrity violation',
        violationType: status === 'backward' ? 'backward_jump' : 'forward_jump',
        jumpMs: typeof deltaMs === 'number' ? Math.abs(deltaMs) : undefined
    };
};

export const createTimeIntegrityMiddleware = (): TeaMiddleware<any, any> => {
    // Local cache for the current transaction ID to avoid redundant validations
    let lastProcessedTraceId: string | null = null;

    return {
        id: 'time-integrity-v2',

        beforeUpdate: async (model, msg, meta) => {
            // Initialize meta object if not exists
            const timeMeta = meta as TimeIntegrityMeta;

            // 1. TraceID Deduplication
            if (meta.traceId && meta.traceId === lastProcessedTraceId) {
                timeMeta.timeIntegrityChecked = true;
                return;
            }
            lastProcessedTraceId = meta.traceId;

            const msgType = getMsgType(msg);
            const shouldSkip = [
                AuthMsgType.SESSION_EXPIRED,
                AuthMsgType.LOGOUT_REQUESTED,
                AuthMsgType.USER_CHANGED, // This was causing the infinite loop!
                'LOGIN_',
                'AUTH_'
            ].some(skipType =>
                msgType === skipType || msgType?.startsWith(skipType)
            );

            if (shouldSkip) {
                timeMeta.timeIntegrityChecked = true;
                return;
            }

            if (!isBetCommitMessage(msg)) {
                timeMeta.timeIntegrityChecked = true;
                return;
            }

            // Check if user is in a state that should skip validation
            const authStatus = (model as any)?.auth?.status;
            const shouldSkipForState = ['EXPIRED', 'LOGGING_OUT', 'ANONYMOUS'].includes(authStatus);

            if (shouldSkipForState) {
                timeMeta.timeIntegrityChecked = true;
                return;
            }

            try {
                const integrity = await TimerRepository.validateIntegrity(Date.now());
                const result =
                    integrity.status === 'ok'
                        ? ({ status: 'ok' } as const)
                        : toValidationResult(integrity.status, integrity.reason, integrity.deltaMs);

                timeMeta.timeIntegrityChecked = true;
                timeMeta.timeIntegrityViolation = result.status === 'violation' ? result : undefined;

                if (result.status === 'violation') {
                    log.warn('Time integrity violation detected (pure validation)', {
                        violationType: result.violationType,
                        reason: result.reason,
                        jumpMs: result.jumpMs,
                        msgType
                    });
                }

            } catch (error) {
                log.error('Error during time integrity validation', error);
                timeMeta.timeIntegrityChecked = true;
            }
        },

        afterUpdate: (prevModel, msg, nextModel, cmd, meta) => {
            const timeMeta = meta as TimeIntegrityMeta;

            // Only act if we found a violation and it should trigger action
            if (timeMeta.timeIntegrityViolation) {
                const coordinator = SessionSecurityCoordinator.getInstance();
                coordinator.handleTimeIntegrityViolation(timeMeta.timeIntegrityViolation);

                // Clear the violation to prevent re-processing
                timeMeta.timeIntegrityViolation = undefined;
            }
        }
    };
};
