
import { AuthRepository } from '@/shared/repositories/auth';
import { setAuthRepository } from '@/core/core_module/service';
import { CoreModule } from '@/core/core_module';
import { createElmStore } from '@/shared/core/engine/engine';
import { AuthErrorType } from '@/shared/repositories/auth/types/types';
import { isServerReachable } from '@/shared/utils/network';
import { logger } from '@/shared/utils/logger';

// Mocks
jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
    addEventListener: jest.fn(),
}));

// Mock de fetch global para isServerReachable
(global as any).fetch = jest.fn();

describe('Connectivity Sync & Auth Fallback Policy', () => {
    const log = logger.withTag('CONNECTIVITY_TEST');
    const waitForEffects = () => new Promise(resolve => setTimeout(resolve, 50));

    beforeEach(() => {
        jest.clearAllMocks();
        setAuthRepository(AuthRepository);
        // Reset singleton state for proper test isolation
        (AuthRepository as any).isNetworkOnline = true;
        (AuthRepository as any).offlineConditionChecker = null;
        (AuthRepository as any).api = undefined;
        (AuthRepository as any).storage = undefined;
        (AuthRepository as any).timeRepo = {
            validateIntegrity: jest.fn(() => ({ status: 'ok' }))
        };
    });

    describe('isServerReachable SSoT Policy', () => {
        test('Should return true for 200 OK (Reachable)', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200
            });

            const result = await isServerReachable();
            expect(result).toBe(true);
        });

        test('Should return true for 500 Internal Server Error (Reachable but unhealthy)', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await isServerReachable();
            expect(result).toBe(true);
            log.info('Confirmed: 500 status is considered REACHABLE to allow online auth attempts');
        });

        test('Should return false for network timeout/error (Unreachable)', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

            const result = await isServerReachable();
            expect(result).toBe(false);
        });
    });

    describe('CoreModule to AuthRepository Propagation', () => {
        test('CoreModule should update AuthRepository network status when physical connectivity changes', async () => {
            const testStore = createElmStore(CoreModule.definition);
            const { dispatch, cleanup } = testStore.getState();

            // Use PHYSICAL_CONNECTION_CHANGED (valid TEA message for CoreModule)
            dispatch({ type: 'PHYSICAL_CONNECTION_CHANGED', payload: false });
            await waitForEffects();
            expect((AuthRepository as any).isNetworkOnline).toBe(false);

            dispatch({ type: 'PHYSICAL_CONNECTION_CHANGED', payload: true });
            await waitForEffects();
            expect((AuthRepository as any).isNetworkOnline).toBe(true);

            cleanup();
        });
    });

    describe('AuthRepository Fallback Blocking', () => {
        test('Should block offline fallback when server returns 500', async () => {
            const mockApi = {
                login: jest.fn().mockResolvedValue({
                    success: false,
                    error: {
                        type: AuthErrorType.SERVER_ERROR,
                        message: 'Internal Server Error'
                    }
                }),
                logout: jest.fn(),
                getMe: jest.fn(),
                refresh: jest.fn()
            };
            const mockStorage = {
                validateOffline: jest.fn(),
                saveSession: jest.fn(),
                saveOfflineCredentials: jest.fn(),
                getUserProfile: jest.fn(),
                getOfflineProfile: jest.fn(),
                getSession: jest.fn(),
                purgeLegacyData: jest.fn(),
                clearSession: jest.fn(),
                saveLastUsername: jest.fn(),
                getLastUsername: jest.fn()
            };

            (AuthRepository as any).api = mockApi;
            (AuthRepository as any).storage = mockStorage;
            (AuthRepository as any).isNetworkOnline = true;

            const result = await AuthRepository.login('tester', '123456');

            expect(mockApi.login).toHaveBeenCalledWith('tester', '123456');
            // Ensure no offline fallback attempt occurred for 500 error
            expect(mockStorage.validateOffline).not.toHaveBeenCalled();
            expect(result.success).toBe(false);
            if (!result.success && result.error) {
                expect(result.error.type).toBe(AuthErrorType.SERVER_ERROR);
            }

            log.info('Confirmed: Offline fallback blocked for SERVER_ERROR (500)');
        });

        test('Should allow offline fallback when network is truly OFFLINE', async () => {
            const mockStorage = {
                validateOffline: jest.fn().mockResolvedValue({
                    success: true,
                    data: { user: { username: 'tester' }, isOffline: true }
                }),
                saveSession: jest.fn(),
                saveOfflineCredentials: jest.fn(),
                getUserProfile: jest.fn(),
                getOfflineProfile: jest.fn(),
                getSession: jest.fn(),
                purgeLegacyData: jest.fn(),
                clearSession: jest.fn(),
                saveLastUsername: jest.fn(),
                getLastUsername: jest.fn()
            };

            (AuthRepository as any).storage = mockStorage;
            (AuthRepository as any).isNetworkOnline = false;
            (AuthRepository as any).offlineConditionChecker = {
                canContinueOffline: jest.fn().mockResolvedValue(true)
            };

            const result = await AuthRepository.login('tester', '123456');

            expect(result.success).toBe(true);
            expect(mockStorage.validateOffline).toHaveBeenCalledWith('tester', '123456');
            expect(mockStorage.saveSession).toHaveBeenCalled();
            if (result.success && result.data) {
                // Confirm the response correctly identifies the offline session
                expect(result.data.isOffline).toBe(true);
            }

            log.info('Confirmed: Offline fallback allowed when global sensor reports OFFLINE');
        });
    });
});
