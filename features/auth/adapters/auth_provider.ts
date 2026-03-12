import { AuthProvider, LoginParams, AuthResult as KernelAuthResult } from '@core/architecture/interfaces';
import { AuthRepository, AuthErrorType } from '../../../shared/repositories/auth';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('AUTH_PROVIDER');

/**
 * Concrete Implementation of AuthProvider for the Game Reset Application.
 * Ahora es un simple adaptador que delega toda la lógica a AuthRepository.
 * AuthRepository maneja el orchestramiento completo incluyendo fallback offline.
 */
export const gameResetAuthProvider: AuthProvider = {
    login: async (params: LoginParams): Promise<KernelAuthResult> => {
        const { username, pin } = params;
        log.info('Delegating login to AuthRepository', { username });

        try {
            // AuthRepository maneja toda la lógica: online, offline, tokens, etc.
            const result = await AuthRepository.login(username, pin);
            if (result.success) {
                return { success: true, data: result.data };
            }
            return {
                success: false,
                error: {
                    message: result.error.message,
                    redirectTo: result.error.redirectTo
                }
            };
        } catch (error: any) {
            log.error('Unexpected error during login delegation', error);
            return {
                success: false,
                error: {
                    message: 'Ocurrió un error inesperado al iniciar sesión'
                }
            };
        }
    },

    logout: async (): Promise<KernelAuthResult> => {
        log.info('Delegating logout to AuthRepository');

        try {
            await AuthRepository.logout();
            return { success: true };
        } catch (error: any) {
            log.error('Unexpected error during logout delegation', error);
            return {
                success: false,
                error: {
                    message: 'Error al cerrar sesión'
                }
            };
        }
    },

    checkError: async (error: any) => {
        // Handled globally by CoreModule
        return;
    },

    checkAuth: async () => {
        await AuthRepository.checkAuth();
    },

    getPermissions: async () => Promise.resolve([]),

    getUserIdentity: async () => {
        try {
            return await AuthRepository.getMe();
        } catch (error) {
            log.warn('Failed to get user identity', error);
            return null;
        }
    }
};