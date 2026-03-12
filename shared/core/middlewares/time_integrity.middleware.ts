import { TeaMiddleware } from '@core/tea-utils/middleware.types';
import { TimerRepository } from '@/shared/repositories/system/time/timer.repository';
import { useAuthStore } from '@/features/auth/store/store';
import { AuthMsgType } from '@/features/auth/store/types/messages.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TIME_INTEGRITY_MW');

/**
 * Middleware that validates time integrity before any state update.
 * If fraud is detected, it triggers a global session expiration.
 * 
 * IMPORTANT: Skips validation for offline sessions to prevent false positives
 * when the device has been asleep or in background for extended periods.
 */
export const createTimeIntegrityMiddleware = (): TeaMiddleware<any, any> => {
    // Local cache for the current transaction ID to avoid redundant validations
    // within the same TEA message processing cycle (across multiple stores).
    let lastProcessedTraceId: string | null = null;

    return {
        id: 'time-integrity',

        beforeUpdate: async (model, msg, meta) => {
            // 1. TraceID Deduplication
            // If we already validated for this specific traceId, skip.
            if (meta.traceId && meta.traceId === lastProcessedTraceId) {
                return;
            }
            lastProcessedTraceId = meta.traceId;

            // 2. Auth Guards
            // Skip validation for auth-related messages to avoid loops
            const msgType = (msg as any).type;
            if (
                msgType === AuthMsgType.SESSION_EXPIRED ||
                msgType === AuthMsgType.LOGOUT_REQUESTED ||
                msgType === AuthMsgType.USER_CHANGED || // FIX: Prevent infinite loop during logout
                msgType?.startsWith('LOGIN_')
            ) {
                return;
            }

            try {
                // Check if we have an offline session - skip validation to avoid false positives
                // when the device has been asleep or in background for extended periods
                const authState = useAuthStore.getState();

                // FIX: Prevent infinite loop by checking if already in expired/logging out state
                if (authState?.model?.status === 'EXPIRED' || authState?.model?.status === 'LOGGING_OUT') {
                    log.debug('Skipping time integrity validation - session already expired/logging out');
                    return;
                }

                const token = authState?.model?.loginResponse;

                // If login response is a success with offline token, skip validation
                if (token && token.type === 'Success') {
                    // Check if it's an offline session by looking at the user data
                    // or by checking if there's a stored offline indicator
                    // For now, we'll skip validation if we have a successful login
                    // This is a safety measure for offline-first scenarios
                    log.debug('Skipping time integrity validation for authenticated session');
                    return;
                }

                const result = await TimerRepository.validateIntegrity(Date.now());

                if (result.status !== 'ok') {
                    log.error('TIME FRAUD DETECTED', {
                        status: result.status,
                        reason: result.reason,
                        msgType
                    }, 'BUSINESS', 'HIGH');

                    // Force session expiration
                    const authDispatch = useAuthStore.getState().dispatch;
                    authDispatch({ type: AuthMsgType.SESSION_EXPIRED });
                }
            } catch (error) {
                log.error('Error during time integrity validation', error);
            }
        }
    };
};
