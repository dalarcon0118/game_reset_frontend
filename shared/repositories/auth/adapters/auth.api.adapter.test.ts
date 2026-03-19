
import { authApiAdapter } from './auth.api.adapter';
import { apiClient } from '../../../services/api_client';
import { AuthErrorType } from '../types/types';
import { settings } from '@/config/settings';
import { logger } from '@/shared/utils/logger';

// Mock de NetInfo para permitir llamadas reales
jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}));

describe('AuthApiAdapter - Capa de Transporte/API', () => {

    beforeAll(async () => {
        // Inicializamos solo lo necesario para el ApiClient
        apiClient.config({
            settings,
            log: logger.withTag('TEST_API_CLIENT')
        });
    });

    test('Debe mapear 401 a INVALID_CREDENTIALS', async () => {
        // Forzamos un error 401 mediante una llamada real con datos basura
        const result = await authApiAdapter.login('usuario_inexistente', '999999');

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
        }
    });

    test('Debe manejar correctamente una respuesta 200 con datos válidos', async () => {
        // Usuario real configurado en el backend
        const result = await authApiAdapter.login('jose', '123456');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.user.username).toBe('jose');
            expect(result.data.accessToken).toBeDefined();
        }
    });

    // Nota: El test de 403 (DEVICE_LOCKED) dependería de que el backend 
    // realmente bloquee el dispositivo para este usuario.
});
