import { AuthRepository } from '@/shared/repositories/auth';
import { authStorageAdapter } from '@/shared/repositories/auth/adapters/auth.storage.adapter';
import { deviceRepository } from '@/shared/repositories/system/device';
import { apiClient } from '@/shared/services/api_client';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { settings } from '@/config/settings';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '@/shared/utils/logger';
import { Transport } from '@/shared/services/api_client/infra';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock de Axios para el ApiClient
const mockAxios = new MockAdapter(axios);

// Mock de NetInfo para evitar errores en isServerReachable
jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}));

// Mock de fetch global para isServerReachable y ApiClient
(global as any).fetch = jest.fn();

describe('Device Identity E2E Integration Flow', () => {
    const mockDeviceId = 'test-device-uuid-123';
    const otherDeviceId = 'different-device-uuid-456';
    const mockUser = { id: '1', username: 'tester', name: 'Test User', role: 'admin', active: true, email: 'test@example.com' };

    // Tokens simulados en formato JWT (header.payload.signature) 
    // El payload base64 contiene {"exp": 9999999999} para que no expire nunca en el test
    const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature';
    const mockTokens = { access: validJwt, refresh: 'refresh.' + validJwt };

    beforeAll(() => {
        // Inicializar ApiClient antes de los tests
        apiClient.config({
            settings,
            log: logger.withTag('API_CLIENT_TEST'),
            tokenStorageGetter: () => AuthRepository,
            deviceRepository
        });

        // Interceptar fetch de Transport para usar mockAxios
        jest.spyOn(Transport.prototype, 'fetchWithTimeout').mockImplementation(async (url, config) => {
            try {
                const method = (config.method || 'GET').toLowerCase();
                const response = await axios({
                    url,
                    method,
                    data: config.body ? JSON.parse(config.body as string) : undefined,
                    headers: config.headers as any,
                });

                return {
                    ok: response.status >= 200 && response.status < 300,
                    status: response.status,
                    json: () => Promise.resolve(response.data),
                    headers: {
                        get: (name: string) => response.headers[name.toLowerCase()] || null
                    }
                } as any;
            } catch (error: any) {
                if (error.response) {
                    return {
                        ok: false,
                        status: error.response.status,
                        json: () => Promise.resolve(error.response.data),
                        headers: {
                            get: (name: string) => error.response.headers[name.toLowerCase()] || null
                        }
                    } as any;
                }
                throw error;
            }
        });
    });

    beforeEach(async () => {
        mockAxios.reset();
        jest.clearAllMocks();

        // Mock de fetch global para isServerReachable (el primer ping)
        (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

        // Limpiar storage y cache del repositorio
        await authStorageAdapter.clearSession();
        await AsyncStorage.clear();
        (AuthRepository as any).isHydrated = false;
        (AuthRepository as any).currentUser = null;

        // Mock de Crypto.randomUUID para DeviceRepository
        const mockRandomUUID = Crypto.randomUUID as jest.Mock;
        if (mockRandomUUID && mockRandomUUID.mockReturnValue) {
            mockRandomUUID.mockReturnValue(mockDeviceId);
        } else {
            // Fallback si no es un mock directo
            (Crypto as any).randomUUID = jest.fn().mockReturnValue(mockDeviceId);
        }

        // Mock de SecureStore para persistencia de Device ID
        let store: Record<string, string> = {};
        if (!(SecureStore.setItemAsync as jest.Mock).mockImplementation) {
            (SecureStore as any).setItemAsync = jest.fn();
            (SecureStore as any).getItemAsync = jest.fn();
            (SecureStore as any).deleteItemAsync = jest.fn();
        }

        (SecureStore.setItemAsync as jest.Mock).mockImplementation((key, value) => {
            store[key] = value;
            return Promise.resolve();
        });
        (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
            return Promise.resolve(store[key] || null);
        });
        (SecureStore.deleteItemAsync as jest.Mock).mockImplementation((key) => {
            delete store[key];
            return Promise.resolve();
        });
    });

    test('Scenario 1: Successful login should persist device ID and include it in subsequent requests', async () => {
        // 1. Mock de respuesta de login exitosa
        const loginUrl = settings.api.baseUrl + settings.api.endpoints.login();
        const meUrl = settings.api.baseUrl + settings.api.endpoints.me();

        mockAxios.onPost(loginUrl).reply(200, {
            access: mockTokens.access,
            refresh: mockTokens.refresh,
            user: mockUser
        });

        // 2. Ejecutar login
        const result = await AuthRepository.login('tester', '1234');

        // 3. Verificaciones de login
        expect(result.success).toBe(true);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
            'system_device_unique_identity',
            mockDeviceId,
            expect.any(Object)
        );

        // 4. Mock de petición protegida posterior
        mockAxios.onGet(meUrl).reply(200, mockUser);

        // 5. Ejecutar petición y verificar headers
        await apiClient.get(settings.api.endpoints.me());

        const lastRequest = mockAxios.history.get.find(r => r.url === meUrl);
        expect(lastRequest?.headers?.['X-Device-Id']).toBe(mockDeviceId);
        // Usamos lowercase porque axios normaliza los headers en su historia de peticiones
        expect(lastRequest?.headers?.['Authorization'] || lastRequest?.headers?.['authorization']).toBe(`Bearer ${mockTokens.access}`);
    });

    test('Scenario 2: Hydration should be successful and session must be valid', async () => {
        // 1. Simular sesión previa guardada
        await authStorageAdapter.saveSession({
            accessToken: mockTokens.access,
            refreshToken: mockTokens.refresh,
            user: mockUser,
            isOffline: false
        });

        // 2. Mock de SecureStore para el ID único oficial
        (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
            if (key === 'system_device_unique_identity') return Promise.resolve(mockDeviceId);
            return Promise.resolve(null);
        });

        // 3. Intentar hidratar la sesión
        const hydratedUser = await AuthRepository.hydrate();

        // 4. Verificar que la hidratación se mantiene válida
        expect(hydratedUser).not.toBeNull();
        const session = await authStorageAdapter.getSession();
        expect(session.access).toBe(mockTokens.access);
    });

    test('Scenario 3: Device mismatch error from server (403) should trigger DEVICE_LOCKED state', async () => {
        // 1. Mock de respuesta 403 (Forbidden) del servidor indicando bloqueo por dispositivo
        const loginUrl = settings.api.baseUrl + settings.api.endpoints.login();
        mockAxios.onPost(loginUrl).reply(403, {
            message: 'Este dispositivo no está autorizado para esta cuenta'
        });

        // 2. Intentar login
        const result = await AuthRepository.login('tester', '1234');

        // 3. Verificar que el error sea DEVICE_LOCKED
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.type).toBe('DEVICE_LOCKED');
            expect(result.error.message).toContain('autorizado');
        }
    });
});
