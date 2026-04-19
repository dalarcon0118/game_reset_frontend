import { apiClient } from '../../../services/api_client';
import settings from '../../../../config/settings';
import { BackendLoginResponseCodec, decodeOrFallback } from '../codecs/codecs';
import { IAuthApi } from '../auth.ports';
import { AuthResult, User, AuthErrorType } from '../types/types';
import { logger } from '../../../utils/logger';
import { AUTH_LOG_TAGS, AUTH_LOGS } from '../auth.constants';
import { hashString } from '../../../utils/crypto';
import { mapAuthErrorToType, mapAuthBackendError, extractBackendErrorCode } from '../auth.error-mapper';
import { getClientMetadata } from '../../../utils/client_metadata';

const log = logger.withTag(AUTH_LOG_TAGS.API_ADAPTER);

export const authApiAdapter: IAuthApi = {
    async login(username: string, pin: string): Promise<AuthResult> {
        try {
            log.info(AUTH_LOGS.LOGIN_ATTEMPT, { username });

            const clientMetadata = getClientMetadata();
            log.info('[AUTH_API] Client metadata for login:', clientMetadata);

            const hashedPin = await hashString(pin);
            const response = await apiClient.post<any>(
                settings.api.endpoints.login(),
                { username, password: hashedPin },
                { headers: { 'X-Client-Metadata': JSON.stringify(clientMetadata) } }
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
            // ⚡ Usar log.error() para que registerErrorObserver capture el error de login
            // El sistema de telemetría centralizado escuchará este error automáticamente
            log.error(AUTH_LOGS.LOGIN_FAILED, error, { username, status: error.status, errorData: error.data });

            // Extraer información del error - el backend puede devolver dos formatos:
            // 1. { success: false, error: { code, message, details } } - patrón Result
            // 2. { detail: "...", error_code: "..." } - patrón de excepciones
            const errorData = error.data || {};
            
            // El backend devuelve el código en error.code (patrón Result)
            const backendCode = errorData.error?.code || extractBackendErrorCode(errorData);
            
            // Extraer mensaje del backend - priorizar según el formato recibido
            // Para el patrón Result: { error: { message: "..." } }
            // Para el patrón de excepción: { detail: "..." }
            const backendMessage = 
                errorData.error?.message || 
                errorData.detail ||
                errorData.message || 
                error.message;
            
            log.info('[AUTH_API] Backend error extracted:', { 
                backendCode, 
                backendMessage,
                fullError: errorData.error,
                detail: errorData.detail
            });

            const errorType = mapAuthErrorToType(error.status, backendMessage, backendCode);
            const errorMessage = mapAuthBackendError(error.status, backendMessage, backendCode);

            log.info('[AUTH_API] Error mapped:', { errorType, errorMessage, backendCode });

            return {
                success: false,
                error: {
                    type: errorType,
                    message: backendMessage || errorMessage,  // Preferir mensaje del backend
                    backendCode: backendCode || undefined
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
            log.warn(AUTH_LOGS.REFRESH_FAILED, { error: error.message, status: error.status, errorData: error.data });

            const backendCode = extractBackendErrorCode(error.data);
            const isInvalidToken = error.status === 401 || error.status === 403;
            const errorMessage = mapAuthBackendError(error.status, error.message, backendCode);

            return {
                success: false,
                error: {
                    type: isInvalidToken ? AuthErrorType.SESSION_EXPIRED : AuthErrorType.SERVER_ERROR,
                    message: errorMessage,
                    backendCode: backendCode || undefined
                }
            };
        }
    }
};
