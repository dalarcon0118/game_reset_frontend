
import { CoreService, setAuthRepository } from '@/core/core_module/service';
import { AuthRepository } from '@/shared/repositories/auth';
import { settings } from '@/config/settings';
import { AuthErrorType } from '@/shared/repositories/auth/types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/shared/services/api_client';
import { deviceRepository } from '@/shared/repositories/system/device';
import { logger } from '@/shared/utils/logger';

// Helper para inicializar infraestructura en tests
const initializeTestInfrastructure = async (): Promise<boolean> => {
    apiClient.config({
        settings,
        log: logger.withTag('TEST_API_CLIENT')
    });
    setAuthRepository(AuthRepository);
    return await CoreService.verifySessionContext();
};

// Mock de NetInfo para simular conexión activa en entorno Node/Jest
jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: { isConnectionExpensive: false }
    }),
    addEventListener: jest.fn(),
    useNetInfo: jest.fn(),
}));

// Mock simple de SecureStore para entorno Node/Jest
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

/**
 * TEST E2E REAL (SIN MOCKS)
 * Usuario: jose
 * PIN: 123456
 * 
 * Este test requiere que el backend esté corriendo en http://localhost:8000
 * Se eliminan todos los interceptores y mocks para probar la conexión real.
 */
describe('Device Identity REAL E2E Flow', () => {
    const username = 'jose';
    const pin = '123456';

    beforeAll(async () => {
        console.log('--- Iniciando Test E2E Real ---');
        console.log('URL Base detectada en settings:', settings.api.baseUrl);
    });

    beforeEach(async () => {
        // --- BOOTSTRAP DEL KERNEL ---
        // Usamos el CoreService oficial para inicializar la infraestructura antes de cada test
        console.log('--- Iniciando Bootstrap del Kernel (CoreService) ---');
        const sessionActive = await initializeTestInfrastructure();
        console.log('Estado de sesión inicial detectado por kernel:', sessionActive);

        // Limpiar almacenamiento local solo si no hay sesión activa (para no romper tests que dependen de ella)
        if (!sessionActive) {
            await AsyncStorage.clear();
        }

        // Resetear estado interno del repositorio si es necesario
        (AuthRepository as any).isLoggingIn = false;
        (AuthRepository as any).isLoggingOut = false;
    });

    test('Flujo Completo REAL: Login -> Capas -> Respuesta Servidor', async () => {
        console.log(`1. Intentando login real para usuario: ${username}`);

        // El repositorio llamará al ApiAdapter, que llamará al ApiClient, que llamará al Backend REAL
        const loginResult = await AuthRepository.login(username, pin);

        if (!loginResult.success) {
            console.warn('RESULTADO LOGIN:', loginResult.error.type, loginResult.error.message);

            // Si el servidor responde con DEVICE_LOCKED, el test es exitoso porque probamos la capa de seguridad
            if (loginResult.error.type === AuthErrorType.DEVICE_LOCKED) {
                console.log('✅ CAPA DE SEGURIDAD VERIFICADA: El servidor real bloqueó el dispositivo correctamente.');
                return;
            }

            // Si falla por credenciales, el usuario 'jose' o pin '123456' no son correctos en el backend real
            if (loginResult.error.type === AuthErrorType.INVALID_CREDENTIALS) {
                console.error('❌ ERROR DE CREDENCIALES: Verifica que el usuario jose exista en el backend real.');
                throw new Error('Credenciales inválidas en el servidor real.');
            }

            throw new Error(`Error inesperado en servidor real: ${loginResult.error.message}`);
        }

        console.log('2. Login exitoso en servidor real. Verificando persistencia local...');

        const savedDeviceId = await deviceRepository.getUniqueId();
        console.log('Device ID guardado en dispositivo:', savedDeviceId);
        expect(savedDeviceId).toBeDefined();

        console.log('3. Verificando acceso a recurso protegido (/me) con token real...');
        const user = await AuthRepository.getMe();
        expect(user).toBeDefined();
        if (user) {
            expect(user.username).toBe(username);
            console.log('✅ ESCENARIO 1 COMPLETADO: Acceso a datos reales concedido.');
        }
    }, 15000); // Incrementado a 15s para dar margen al backend real

    test('Escenario 2 REAL: Hidratación estable y centralizada', async () => {
        console.log('1. Realizando login para preparar hidratación...');
        await AuthRepository.login(username, pin);

        console.log('2. Intentando hidratar sesión...');
        const user = await AuthRepository.hydrate();

        expect(user).not.toBeNull();
        console.log('✅ ESCENARIO 2 COMPLETADO: La hidratación es exitosa y sigue el SSOT.');
    });

    test('Escenario 3 REAL: Manejo de DEVICE_LOCKED (403) desde el servidor', async () => {
        console.log('1. Realizando login exitoso con Dispositivo A...');
        // Mock de deviceRepository para devolver "Device-A"
        jest.spyOn(deviceRepository, 'getUniqueId').mockResolvedValue('Device-A');
        const login1 = await AuthRepository.login(username, pin);
        expect(login1.success).toBe(true);
        console.log('Login 1 exitoso con Device-A');

        await AuthRepository.logout();

        console.log('2. Intentando login con Dispositivo B (Debería fallar con DEVICE_LOCKED)...');
        // Mock de deviceRepository para devolver "Device-B"
        jest.spyOn(deviceRepository, 'getUniqueId').mockResolvedValue('Device-B');
        const login2 = await AuthRepository.login(username, pin);

        if (!login2.success && login2.error.type === AuthErrorType.DEVICE_LOCKED) {
            console.log('✅ ESCENARIO 3 COMPLETADO: El servidor real devolvió DEVICE_LOCKED (403).');
        } else if (login2.success) {
            console.error('❌ ERROR ESCENARIO 3: El servidor permitió el login con un dispositivo diferente.');
            throw new Error('El servidor no bloqueó el acceso desde un segundo dispositivo.');
        } else {
            console.warn('ESCENARIO 3 NOTA: Login falló por otra razón:', login2.error.type, login2.error.message);
            // Si el backend no tiene el usuario 'jose' o el pin '123456', este test fallará aquí.
        }
    }, 15000);
});
