import { createElmStore } from '@/shared/core/engine';
import { createTestMiddleware } from '@/shared/core/middlewares/test.middleware';
import { update } from '@/features/listero-dashboard/core/update';
import { Msg } from '@/features/listero-dashboard/core/msg';
import { Model } from '@/features/listero-dashboard/core/model';
import { initialState } from '@/features/listero-dashboard/core/initial.types';
import { effectHandlers } from '@/shared/core/effect_handlers';
import apiClient from '@/shared/services/api_client';
import { AuthApi } from '@/shared/services/auth/api';
import { User } from '@/shared/services/auth/types';
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
    const store = createElmStore<Model, Msg>(
        initialState,
        update,
        effectHandlers as any,
        undefined, // No subscriptions for now
        [testMiddleware.middleware]
    );

    // 4. Helper for Real Auth
    const authenticateRealUser = async (username: string, pin: string): Promise<User> => {
        try {
            console.log(`Attempting real login for user: ${username}`);
            const response = await AuthApi.login(username, pin);
            console.log('Login successful');
            await apiClient.setAuthToken(response.access, response.refresh);
            return response.user;
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
