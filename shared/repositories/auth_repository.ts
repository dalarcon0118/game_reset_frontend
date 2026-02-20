import { AuthApi } from '../services/auth/api';
import apiClient from '../services/api_client';
import { User } from '../services/auth/types';
import { OfflineAuthService } from '../services/offline_auth_service';
import { NetworkUtils } from '../utils/network_utils';
import { logger } from '../utils/logger';
import { AuthResult } from '../core/architecture/interfaces';

const log = logger.withTag('AUTH_REPO');

/**
 * AuthRepository - Orchestrador de autenticación
 * Maneja la lógica completa de autenticación incluyendo fallback offline
 * Los tokens son manejados automáticamente por apiClient
 */
export const AuthRepository = {
    /**
     * Login con lógica de fallback offline integrada
     */
    login: async (username: string, password: string): Promise<AuthResult> => {
        try {
            log.info('Attempting online login', { username });

            // 1. Intenta login online (apiClient maneja tokens automáticamente)
            const response = await AuthApi.login(username, password);
            log.info('Online login successful', { username });

            // Validar que la respuesta tenga los campos necesarios
            if (!response.access || !response.user) {
                throw new Error('Respuesta de login inválida: falta access token o usuario');
            }

            // Force token update in ApiClient
            await apiClient.setAuthToken(response.access, response.refresh || null);

            // 2. Guarda credenciales offline para fallback futuro
            try {
                await OfflineAuthService.saveOfflineCredentials(username, password, response.user);
            } catch (offlineError) {
                log.warn('Failed to save offline credentials', offlineError);
                // No falla el login si no puede guardar offline
            }

            return {
                success: true,
                data: { ...response.user, isOffline: false }
            };

        } catch (onlineError: any) {
            const errorMsg = onlineError.message || '';
            log.warn('Online login failed', { username, error: errorMsg });

            // Manejo específico de errores de validación
            if (errorMsg.includes('decode failed') || errorMsg.includes('validation')) {
                log.error('Login response validation failed', { username, error: errorMsg });
                return {
                    success: false,
                    error: {
                        name: 'ValidationError',
                        message: 'Error de validación en la respuesta del servidor'
                    }
                };
            }

            // 3. Fallback offline automático
            if (NetworkUtils.isNetworkError(onlineError)) {
                log.info('Server unavailable, attempting offline authentication', { username });

                const offlineUser = await OfflineAuthService.validateCredentials(username, password);

                if (offlineUser) {
                    log.info('Offline authentication successful', { username });
                    return {
                        success: true,
                        data: offlineUser
                    };
                }
            }

            return {
                success: false,
                error: {
                    name: 'LoginFailed',
                    message: onlineError.message || 'Credenciales inválidas'
                }
            };
        }
    },

    /**
     * Logout que maneja tanto online como limpieza local
     */
    logout: async (): Promise<void> => {
        try {
            log.info('Attempting remote logout');
            await AuthApi.logout();
            log.info('Remote logout successful');
        } catch (error) {
            log.warn('Remote logout failed, proceeding with local cleanup', error);
            // No falla el logout si no puede hacerlo remoto
        }

        // Limpieza offline siempre se intenta
        try {
            // Nota: apiClient maneja la limpieza de tokens automáticamente
            // No necesitamos llamar a clearAuthToken aquí
            log.info('Local logout completed');
        } catch (localError) {
            log.warn('Local logout cleanup failed', localError);
        }
    },

    /**
     * Obtiene información del usuario actual
     */
    getMe: async (): Promise<User> => {
        log.debug('Fetching user identity');
        return await AuthApi.getMe();
    }
};