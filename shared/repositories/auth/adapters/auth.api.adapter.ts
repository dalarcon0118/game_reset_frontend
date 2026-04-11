import { apiClient } from '../../../services/api_client';
import settings from '../../../../config/settings';
import { BackendLoginResponseCodec, decodeOrFallback } from '../codecs/codecs';
import { IAuthApi } from '../auth.ports';
import { AuthResult, User, AuthErrorType } from '../types/types';
import { logger } from '../../../utils/logger';
import { AUTH_LOG_TAGS, AUTH_LOGS, SERVER_ERROR_PATTERNS } from '../auth.constants';
import { hashString } from '../../../utils/crypto';

const log = logger.withTag(AUTH_LOG_TAGS.API_ADAPTER);

/**
 * Determina si un mensaje del servidor contiene información específica que debe preservarse
 */
const isServerSpecificMessage = (message: string): boolean => {
    const serverSpecificPatterns = [
        SERVER_ERROR_PATTERNS.DEVICE_LOCKED,
        SERVER_ERROR_PATTERNS.MISMATCH_DETECTED,
        SERVER_ERROR_PATTERNS.USER_ID_PREFIX,
        SERVER_ERROR_PATTERNS.INCOMING_PREFIX,
        SERVER_ERROR_PATTERNS.STORED_PREFIX
    ];

    return serverSpecificPatterns.some(pattern => message.includes(pattern));
};

export const authApiAdapter: IAuthApi = {
    async login(username: string, pin: string): Promise<AuthResult> {
        try {
            log.info(AUTH_LOGS.LOGIN_ATTEMPT, { username });

            const hashedPin = await hashString(pin);
            const response = await apiClient.post<any>(
                settings.api.endpoints.login(),
                { username, password: hashedPin }
            );

            const validated = decodeOrFallback(BackendLoginResponseCodec, response, 'login');

            log.info('[AUTH_API] Raw response from login:', {
                hasResponse: !!response,
                responseKeys: response ? Object.keys(response) : [],
                dailySecretInResponse: response?.daily_secret ? 'PRESENTE' : 'AUSENTE',
                dailySecretValue: response?.daily_secret ? `${response.daily_secret.substring(0, 10)}...` : 'N/A',
                timeAnchorInResponse: response?.time_anchor ? 'PRESENTE' : 'AUSENTE'
            });

            if (!validated.access || !validated.user) {
                return {
                    success: false,
                    error: {
                        type: AuthErrorType.SERVER_ERROR,
                        message: AUTH_LOGS.LOGIN_INVALID_RESPONSE
                    }
                };
            }

            return {
                success: true,
                data: {
                    user: validated.user as User,
                    accessToken: validated.access,
                    refreshToken: validated.refresh,
                    confirmationToken: validated.confirmation_token,
                    dailySecret: validated.daily_secret,
                    timeAnchor: validated.time_anchor,
                    needs_pin_change: validated.needs_pin_change,
                    isOffline: false
                }
            };

        } catch (error: any) {
            log.warn(AUTH_LOGS.LOGIN_FAILED, { username, error: error.message, status: error.status });

            const isNetworkError =
                error.status === 0 ||
                error.message?.toLowerCase().includes('network') ||
                error.message?.toLowerCase().includes('timeout') ||
                error.message?.toLowerCase().includes('abort') ||
                !error.status;

            const isServerError = error.status >= 500;
            const isInvalidCredentials = error.status === 401;
            const isDeviceLocked = error.status === 403;

            let errorType = AuthErrorType.UNKNOWN_ERROR;
            if (isNetworkError) errorType = AuthErrorType.CONNECTION_ERROR;
            else if (isServerError) errorType = AuthErrorType.SERVER_ERROR;
            else if (isInvalidCredentials) errorType = AuthErrorType.INVALID_CREDENTIALS;
            else if (isDeviceLocked) errorType = AuthErrorType.DEVICE_LOCKED;

            // Usar mensaje crudo del servidor para errores específicos como DEVICE_LOCKED
            const shouldUseRawMessage = isDeviceLocked && error.message && isServerSpecificMessage(error.message);
            const errorMessage = shouldUseRawMessage ? error.message : (error.message || AUTH_LOGS.LOGIN_AUTH_ERROR);

            return {
                success: false,
                error: {
                    type: errorType,
                    message: errorMessage
                }
            };
        }
    },

    async logout(): Promise<void> {
        await apiClient.post(settings.api.endpoints.logout(), {}, { skipAuthHandler: true });
    },

    async getMe(): Promise<User> {
        return await apiClient.get<User>(settings.api.endpoints.me());
    },

    async refresh(refreshToken: string): Promise<AuthResult> {
        try {
            log.info(AUTH_LOGS.REFRESH_ATTEMPT);
            const response = await apiClient.post<any>(
                settings.api.endpoints.refresh(),
                { refresh: refreshToken },
                { skipAuthHandler: true }
            );

            const validated = decodeOrFallback(BackendLoginResponseCodec, response, 'refresh');

            if (!validated.access) {
                return {
                    success: false,
                    error: {
                        type: AuthErrorType.SERVER_ERROR,
                        message: AUTH_LOGS.REFRESH_INVALID_RESPONSE
                    }
                };
            }

            return {
                success: true,
                data: {
                    user: validated.user as User,
                    accessToken: validated.access,
                    refreshToken: validated.refresh || refreshToken,
                    confirmationToken: validated.confirmation_token,
                    dailySecret: validated.daily_secret,
                    isOffline: false
                }
            };
        } catch (error: any) {
            log.warn(AUTH_LOGS.REFRESH_FAILED, { error: error.message, status: error.status });

            const isInvalidToken = error.status === 401 || error.status === 403;

            return {
                success: false,
                error: {
                    type: isInvalidToken ? AuthErrorType.SESSION_EXPIRED : AuthErrorType.SERVER_ERROR,
                    message: error.message || AUTH_LOGS.REFRESH_ERROR
                }
            };
        }
    }
};
