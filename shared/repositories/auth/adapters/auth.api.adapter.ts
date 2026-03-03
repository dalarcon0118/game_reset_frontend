import apiClient from '../../../services/api_client/api_client';
import settings from '../../../../config/settings';
import { BackendLoginResponseCodec, decodeOrFallback } from '../codecs/codecs';
import { IAuthApi } from '../auth.ports';
import { AuthResult, User, AuthErrorType } from '../types/types';
import { logger } from '../../../utils/logger';

const log = logger.withTag('AUTH_API_ADAPTER');

export const authApiAdapter: IAuthApi = {
    async login(username: string, pin: string): Promise<AuthResult> {
        try {
            log.info('Attempting online login', { username });

            const response = await apiClient.post<any>(
                settings.api.endpoints.login(),
                { username, password: pin }
            );

            const validated = decodeOrFallback(BackendLoginResponseCodec, response, 'login');

            if (!validated.access || !validated.user) {
                return {
                    success: false,
                    error: {
                        type: AuthErrorType.SERVER_ERROR,
                        message: 'Respuesta de login inválida: falta token o usuario'
                    }
                };
            }

            return {
                success: true,
                data: {
                    user: validated.user as User,
                    accessToken: validated.access,
                    refreshToken: validated.refresh,
                    isOffline: false
                }
            };

        } catch (error: any) {
            log.warn('Online login request failed', { username, error: error.message });

            const isNetworkError =
                error.message?.includes('Network') ||
                error.message?.includes('timeout') ||
                !error.response;

            return {
                success: false,
                error: {
                    type: isNetworkError ? AuthErrorType.CONNECTION_ERROR : AuthErrorType.INVALID_CREDENTIALS,
                    message: error.message || 'Error de conexión'
                }
            };
        }
    },

    async logout(): Promise<void> {
        await apiClient.post(settings.api.endpoints.logout(), {}, { skipAuthHandler: true });
    },

    async getMe(): Promise<User> {
        return await apiClient.get<User>(settings.api.endpoints.me());
    }
};
