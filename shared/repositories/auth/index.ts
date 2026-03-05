import { authApiAdapter } from './adapters/auth.api.adapter';
import { authStorageAdapter } from './adapters/auth.storage.adapter';
import { IAuthApi, IAuthStorage, IAuthRepository } from './auth.ports';
import { AuthResult, User, AuthSession, AuthErrorType } from './types/types';
import { logger } from '../../utils/logger';
import NetInfo from '@react-native-community/netinfo';
import { isServerReachable } from '../../utils/network';
import { setAuthRepository } from '../../services/api_client';

const log = logger.withTag('AUTH_REPOSITORY');

export { AuthApi } from './api/api';
export * from './types/types';
export * from './codecs/codecs';
export * from './auth.ports';
export * from './auth.keys';

/**
 * AuthRepository - Orquestador agnóstico de autenticación y autorización.
 * Maneja flujos online, fallback offline y persistencia.
 */
class AuthRepositoryImpl implements IAuthRepository {
    private sessionListeners: ((user: User | null) => void)[] = [];
    private isLoggingIn = false; // Flag para evitar refresh durante login
    private isLoggingOut = false; // Flag para evitar race conditions durante logout

    constructor(
        private api: IAuthApi = authApiAdapter,
        private storage: IAuthStorage = authStorageAdapter
    ) {
        this.setupConnectivityMonitor();
    }

    private setupConnectivityMonitor() {
        NetInfo.addEventListener(async (state) => {
            // No hacer refresh mientras está haciendo login o logout
            if (this.isLoggingIn || this.isLoggingOut) {
                log.debug('Skipping connectivity refresh during login/logout');
                return;
            }

            if (state.isConnected) {
                const reachable = await isServerReachable();
                if (reachable) {
                    log.info('Network restored, refreshing session in background...');
                    this.refreshSession();
                }
            }
        });
    }

    private async refreshSession() {
        try {
            const hasSession = await this.hasSession();
            if (!hasSession) return;

            const session = await this.storage.getSession();

            // No hacer refresh si es sesión offline
            if (session.isOffline) {
                log.info('Offline session detected, skipping session refresh');
                return;
            }

            const user = await this.api.getMe();
            if (user) {
                const session = await this.storage.getSession();
                await this.storage.saveSession({
                    user,
                    accessToken: session.access!,
                    refreshToken: session.refresh!,
                    isOffline: false
                });
                this.notifySessionListeners(user);
            }
        } catch (error) {
            log.warn('Background session refresh failed', error);
            // If it's a 401/403, the api_client will handle it and eventually we might get a logout
        }
    }

    private notifySessionListeners(user: User | null) {
        this.sessionListeners.forEach(cb => cb(user));
    }

    onSessionChange(callback: (user: User | null) => void): () => void {
        this.sessionListeners.push(callback);
        return () => {
            this.sessionListeners = this.sessionListeners.filter(cb => cb !== callback);
        };
    }

    async saveToken(access: string, refresh?: string): Promise<void> {
        await this.storage.saveSession({
            accessToken: access,
            refreshToken: refresh,
            user: (await this.storage.getUserProfile()) || ({} as User),
            isOffline: false
        });
    }

    async getToken(): Promise<{ access: string | null; refresh: string | null }> {
        return await this.storage.getSession();
    }

    async clearToken(): Promise<void> {
        await this.storage.clearSession();
    }

    /**
     * Login con resiliencia offline.
     * Siempre intenta online primero para mantener los datos frescos.
     */
    async login(username: string, pin: string): Promise<AuthResult> {
        this.isLoggingIn = true;
        try {
            // 0. Pre-check de conectividad para evitar timeouts largos
            const reachable = await isServerReachable();
            if (!reachable) {
                log.info('Server unreachable (fast-check), jumping to offline validation', { username });
                const offlineResult = await this.storage.validateOffline(username, pin);
                if (offlineResult.success && offlineResult.data) {
                    this.notifySessionListeners(offlineResult.data.user);
                }
                return offlineResult;
            }

            // 1. Intento Online
            const onlineResult = await this.api.login(username, pin);

            if (onlineResult.success && onlineResult.data) {
                log.info('Online login successful, persisting session', { username });
                await this.storage.saveSession(onlineResult.data);
                await this.storage.saveOfflineCredentials(username, pin, onlineResult.data.user);
                this.notifySessionListeners(onlineResult.data.user);
                return onlineResult;
            }

            // 2. Fallback Offline solo si hay error de red/servidor
            if (!onlineResult.success) {
                if (onlineResult.error.type === AuthErrorType.CONNECTION_ERROR) {
                    log.info('Network unavailable, attempting offline validation', { username });
                    const offlineResult = await this.storage.validateOffline(username, pin);
                    if (offlineResult.success && offlineResult.data) {
                        this.notifySessionListeners(offlineResult.data.user);
                    }
                    return offlineResult;
                }

                log.warn('Online login failed with domain error', onlineResult.error);
                return onlineResult;
            }

            return onlineResult;

        } catch (error: any) {
            log.error('Unexpected error during login flow', error);
            return {
                success: false,
                error: {
                    type: AuthErrorType.UNKNOWN_ERROR,
                    message: error.message || 'Error inesperado en el sistema'
                }
            };
        } finally {
            this.isLoggingIn = false;
        }
    }

    async logout(): Promise<void> {
        this.isLoggingOut = true;
        try {
            log.info('Performing logout');
            this.api.logout().catch(err => log.warn('Remote logout failed', err));
            await this.storage.clearSession();
            this.notifySessionListeners(null);
            log.info('Local logout completed');
        } catch (error) {
            log.error('Error during logout', error);
        } finally {
            this.isLoggingOut = false;
        }
    }

    async getMe(): Promise<User | null> {
        return await this.storage.getUserProfile();
    }

    async getUserIdentity(): Promise<User | null> {
        return await this.getMe();
    }

    async hasSession(): Promise<boolean> {
        const session = await this.storage.getSession();
        return !!session.access;
    }

    async checkAuth(): Promise<void> {
        const hasSession = await this.hasSession();
        if (!hasSession) {
            this.notifySessionListeners(null);
            throw new Error('No active session');
        }
    }

    async getLastUsername(): Promise<string | null> {
        return await this.storage.getLastUsername();
    }

    async saveLastUsername(username: string): Promise<void> {
        await this.storage.saveLastUsername(username);
    }
}

// Exportamos una instancia única por defecto
export const AuthRepository = new AuthRepositoryImpl();

// Inyectamos la dependencia circular
setAuthRepository(AuthRepository);
