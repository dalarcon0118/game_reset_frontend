import { createElmStore } from '@core/engine/engine';
import { createTestMiddleware } from '@core/middlewares/test.middleware';
import { update } from '@/features/listero/listero-dashboard/core/update';
import { Msg } from '@/features/listero/listero-dashboard/core/msg';
import { Model } from '@/features/listero/listero-dashboard/core/model';
import { initialState } from '@/features/listero/listero-dashboard/core/initial.types';
import { effectHandlers } from '@core/tea-utils';
import apiClient from '@/shared/services/api_client/api_client';
import { AuthRepository, User } from '@/shared/repositories/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
jest.mock('@react-native-async-storage/async-storage', () => {
    let internalStorage: Record<string, string> = {};
    return {
        setItem: jest.fn(async (key, value) => { internalStorage[key] = value; }),
        getItem: jest.fn(async (key) => internalStorage[key] || null),
        removeItem: jest.fn(async (key) => { delete internalStorage[key]; }),
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

jest.mock('@/shared/utils/logger', () => {
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        withTag: jest.fn().mockReturnThis(),
    };
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

    // 3. Create Store
    const store = createElmStore<Model, Msg>({
        initial: initialState,
        update,
        effectHandlers: effectHandlers as any,
        middlewares: [testMiddleware.middleware]
    });

    // 4. Helper for Real Auth
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
        authenticateRealUser
    };
};
