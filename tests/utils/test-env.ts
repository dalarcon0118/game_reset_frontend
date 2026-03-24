import { createElmStore } from '@core/engine/engine';
import { createTestMiddleware } from '@core/middlewares/test.middleware';
import { update } from '@/features/listero/listero-dashboard/core/update';
import { Msg } from '@/features/listero/listero-dashboard/core/msg';
import { Model } from '@/features/listero/listero-dashboard/core/model';
import { initialState } from '@/features/listero/listero-dashboard/core/initial.types';
import { effectHandlers } from '@core/tea-utils';
import { apiClient, setAuthRepository } from '@/shared/services/api_client';
import { AuthRepository, User } from '@/shared/repositories/auth';
import { settings } from '@/config/settings';
import { logger } from '@/shared/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthModuleV1 } from '@/features/auth/v1/adapters/auth_provider';
import { AuthStatus } from '@/shared/auth/v1/model';
import { AuthMsg } from '@/shared/auth/v1/msg';
// Mock de expo-crypto para generar UUIDs reales en tests
jest.mock('expo-crypto', () => {
    const crypto = require('crypto');
    return {
        CryptoDigestAlgorithm: {
            SHA256: 'SHA-256',
        },
        randomUUID: jest.fn(() => crypto.randomUUID()),
        getRandomBytes: jest.fn((size: number) => crypto.randomBytes(size)),
        digestStringAsync: jest.fn(async (algo, value) => {
            if (algo === 'SHA-256') {
                return crypto.createHash('sha256').update(value).digest('hex');
            }
            return value;
        }),
    };
});

// Interface for the extended mock
interface MockedAsyncStorage {
    setItem: jest.Mock;
    getItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
    getAllKeys: jest.Mock;
    _getStorage: () => Record<string, string>;
    _resetStorage: () => void;
}

// Setup Jest mocks
jest.mock('expo-secure-store', () => {
    let storage: Record<string, string> = {};
    return {
        setItemAsync: jest.fn(async (key, value) => { storage[key] = value; }),
        getItemAsync: jest.fn(async (key) => storage[key] || null),
        deleteItemAsync: jest.fn(async (key) => { delete storage[key]; }),
    };
});

jest.mock('@react-native-async-storage/async-storage', () => {
    let internalStorage: Record<string, string> = {};
    return {
        setItem: jest.fn(async (key: string, value: string) => {
            internalStorage[key] = value;
        }),
        getItem: jest.fn(async (key: string) => internalStorage[key] || null),
        removeItem: jest.fn(async (key: string) => {
            delete internalStorage[key];
        }),
        multiSet: jest.fn(async (pairs: [string, string][]) => {
            pairs.forEach(([key, value]) => {
                internalStorage[key] = value;
            });
        }),
        multiGet: jest.fn(async (keys: string[]) => {
            return keys.map(key => [key, internalStorage[key] || null]);
        }),
        multiRemove: jest.fn(async (keys: string[]) => {
            keys.forEach(key => {
                delete internalStorage[key];
            });
        }),
        clear: jest.fn(async () => { internalStorage = {}; }),
        getAllKeys: jest.fn(async () => Object.keys(internalStorage)),
        _getStorage: () => internalStorage,
        _resetStorage: () => { internalStorage = {}; }
    };
});

jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true }),
    addEventListener: jest.fn(() => jest.fn()),
}));

// Mock completo del logger para evitar errores en los middlewares
const createMockLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
    groupCollapsed: jest.fn(),
    withTag: jest.fn().mockReturnThis(),
    withContext: jest.fn().mockReturnThis(),
    trace: jest.fn(),
    table: jest.fn(),
});

jest.mock('@/shared/utils/logger', () => {
    const mockLogger = createMockLogger();
    return {
        __esModule: true,
        default: mockLogger,
        logger: mockLogger,
    };
});

export const createTestEnv = async () => {
    // 1. Reset Storage
    (AsyncStorage as unknown as MockedAsyncStorage)._resetStorage();
    const mockStorage = (AsyncStorage as unknown as MockedAsyncStorage)._getStorage();

    // 2. Setup Middleware
    const testMiddleware = createTestMiddleware<Model, Msg>();

    // 3. Configure ApiClient for Tests
    // Usamos el X-Device-Id verificado con CURL: 92b58374-f0c6-4b08-b837-a22db8e875d0
    apiClient.config({
        settings,
        log: logger.withTag('API_CLIENT_TEST'),
        tokenStorageGetter: () => AuthRepository,
        deviceIdProvider: () => Promise.resolve('92b58374-f0c6-4b08-b837-a22db8e875d0')
    });

    setAuthRepository(AuthRepository);

    // 4. Create Store
    const store = createElmStore<Model, Msg>({
        initial: initialState,
        update,
        effectHandlers: effectHandlers as any,
        middlewares: [testMiddleware.middleware]
    });

    // 5. Initialize AuthModuleV1 Store for tests
    // This is needed because Header component uses useAuth() which requires AuthModuleV1
    const initAuthStore = (user: User) => {
        // Get the internal store API
        const authStoreApi = AuthModuleV1.storeApi as any;
        if (authStoreApi) {
            // Set the authenticated user state
            authStoreApi.setState({
                model: {
                    status: AuthStatus.AUTHENTICATED,
                    user: user,
                    isOffline: false,
                    error: null
                }
            });
            console.log('✅ AuthModuleV1 initialized with user:', user.username);
        }
    };

    // 6. Helper for Real Auth
    const authenticateRealUser = async (username: string, pin: string): Promise<User> => {
        try {
            console.log(`Attempting real login for user: ${username}`);
            const result = await AuthRepository.login(username, pin);
            if (!result.success) {
                throw new Error(result.error.message);
            }
            if (!result.data) {
                throw new Error('No session data received');
            }
            console.log('Login successful');
            await apiClient.setAuthToken(result.data.accessToken, result.data.refreshToken);

            // Initialize AuthModuleV1 with the authenticated user
            initAuthStore(result.data.user);

            return result.data.user;
        } catch (error) {
            console.error('Real login failed. Make sure backend is running on localhost:8000', error);
            throw error;
        }
    };

    return {
        store,
        testMiddleware,
        mockStorage,
        authenticateRealUser,
        initAuthStore,
        cleanup: async () => {
            // Restore any global state if necessary
            console.log('🧹 Test environment cleanup');
        }
    };
};
