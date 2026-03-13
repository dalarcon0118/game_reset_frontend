import { Result, ResultAsync, ok, err } from 'neverthrow';
import { isServerReachable } from '@/shared/utils/network';
import { authApiAdapter } from './adapters/auth.api.adapter';
import { authStorageAdapter } from './adapters/auth.storage.adapter';
import { IAuthApi, IAuthStorage, IAuthRepository } from './auth.ports';
import { AuthResult, User, AuthSession, AuthErrorType } from './types/types';
import { logger } from '../../utils/logger';
import { setAuthRepository } from '../../services/api_client';
import { SessionPolicy } from '@/shared/auth/session/session.policy';
import { TokenState } from '@/shared/auth/session/session.types';

import { TimerRepository } from '../system/time/timer.repository';

const log = logger.withTag('AUTH_REPOSITORY');

export { AuthApi } from './api/api';
export * from './types/types';
export * from './codecs/codecs';
export * from './auth.ports';
export * from './auth.keys';

/**
 * AuthRepository - Orquestador agnóstico de autenticación y autorización.
 * Maneja flujos online, fallback offline y persistencia.
 * Refactored to follow SRP: No longer manages network connectivity.
 */
class AuthRepositoryImpl implements IAuthRepository {
    private sessionListeners: ((user: User | null) => void)[] = [];
    private expiredListeners: ((reason: string) => void)[] = [];
    private refreshedListeners: ((token: string) => void)[] = [];
    private isLoggingIn = false; // Flag para evitar refresh durante login
    private isLoggingOut = false; // Flag para evitar race conditions durante logout
    private isExiting = false; // Flag para prevenir múltiples señales de expiración

    constructor(
        private api: IAuthApi = authApiAdapter,
        private storage: IAuthStorage = authStorageAdapter
    ) {
        // SRP: Connectivity monitor removed from constructor.
    }

    /**
     * Resetea el flag de salida. Útil cuando se inicia un nuevo login.
     */
    resetExitFlag(): void {
        this.isExiting = false;
    }

    /**
     * Retorna si se está en proceso de salida/expiración.
     */
    getIsExiting(): boolean {
        return this.isExiting || this.isLoggingOut;
    }

    /**
     * Marca el inicio de un proceso de salida.
     */
    setExiting(value: boolean): void {
        this.isExiting = value;
    }

    /**
     * Realiza la hidratación de la sesión desde el storage.
     */
    async hydrate(): Promise<User | null> {
        try {
            log.info('Hydrating session from storage...');
            const user = await this.storage.getUserProfile();
            const session = await this.storage.getSession();

            // Reintento rápido si hay token pero no perfil (evitar race conditions tras login)
            if (!user && session.access) {
                log.warn('Access token found but no user profile, retrying in 300ms...');
                await new Promise(resolve => setTimeout(resolve, 300));
                const retryUser = await this.storage.getUserProfile();
                if (retryUser) {
                    log.info('Session hydrated after retry', { username: retryUser.username });
                    this.notifySessionListeners(retryUser);
                    return retryUser;
                }
            }

            const tokenState = SessionPolicy.resolveTokenState(session.access);
            const isValid = tokenState === TokenState.VALID || tokenState === TokenState.EXPIRED || tokenState === TokenState.OFFLINE_MARKER;

            if (user && isValid) {
                log.info('Session hydrated successfully', { username: user.username, tokenState });

                // Ya no notificamos expiración inmediata aquí. 
                // Dejamos que el sistema intente el refresh de forma natural cuando sea necesario.

                this.notifySessionListeners(user);
                return user;
            }

            log.info('No active or valid session found during hydration', { hasUser: !!user, tokenState });
            this.notifySessionListeners(null);
            return null;
        } catch (error) {
            log.error('Error during hydration', error);
            this.notifySessionListeners(null);
            return null;
        }
    }

    /**
     * Declarative session refresh. 
     * Can be called by an external coordinator when network is restored.
     */
    async refreshUserProfile(): Promise<Result<User, Error>> {
        log.debug('[AuthRepository] Manually refreshing user profile...');

        return ResultAsync.fromPromise(
            (async () => {
                const user = await this.api.getMe();
                if (!user) throw new Error('FAILED_TO_GET_USER_PROFILE');

                const session = await this.storage.getSession();
                await this.storage.saveSession({
                    user,
                    accessToken: session.access!,
                    refreshToken: session.refresh!,
                    isOffline: false
                });

                this.notifySessionListeners(user);
                return user;
            })(),
            (e: any) => e instanceof Error ? e : new Error(String(e))
        );
    }

    onSessionChange(callback: (user: User | null) => void): () => void {
        this.sessionListeners.push(callback);
        return () => {
            this.sessionListeners = this.sessionListeners.filter(cb => cb !== callback);
        };
    }

    onSessionExpired(callback: (reason: string) => void): () => void {
        this.expiredListeners.push(callback);
        return () => {
            this.expiredListeners = this.expiredListeners.filter(cb => cb !== callback);
        };
    }

    onTokenRefreshed(callback: (token: string) => void): () => void {
        this.refreshedListeners.push(callback);
        return () => {
            this.refreshedListeners = this.refreshedListeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notificación imperativa de expiración (puente para ApiClient).
     */
    notifySessionExpired(reason: string): void {
        log.warn('Manual session expiration notified', { reason });
        this.notifyExpiredListeners(reason);
    }

    private notifySessionListeners(user: User | null) {
        this.sessionListeners.forEach(cb => cb(user));
    }

    private notifyExpiredListeners(reason: string) {
        this.expiredListeners.forEach(cb => cb(reason));
    }

    private notifyRefreshedListeners(token: string) {
        this.refreshedListeners.forEach(cb => cb(token));
    }

    async saveToken(access: string, refresh?: string): Promise<void> {
        const user = (await this.storage.getUserProfile()) || ({} as User);
        await this.storage.saveSession({
            accessToken: access,
            refreshToken: refresh,
            user,
            isOffline: false
        });
    }

    async clearToken(): Promise<void> {
        await this.storage.clearSession();
    }

    async refresh(): Promise<AuthResult> {
        const { refresh } = await this.getToken();
        if (!refresh) {
            this.notifyExpiredListeners('NO_REFRESH_TOKEN');
            return {
                success: false,
                error: {
                    type: AuthErrorType.SESSION_EXPIRED,
                    message: 'NO_REFRESH_TOKEN'
                }
            };
        }

        try {
            const response = await this.api.refresh(refresh);
            if (response.success && response.data) {
                const { accessToken, refreshToken: newRefresh, user } = response.data;
                const currentUser = (await this.storage.getUserProfile()) || ({} as User);

                await this.storage.saveSession({
                    accessToken,
                    refreshToken: newRefresh || refresh,
                    user: user || currentUser,
                    isOffline: false
                });

                this.notifyRefreshedListeners(accessToken);

                if (user || currentUser.id) {
                    this.notifySessionListeners(user || currentUser);
                }

                return response;
            }

            // Si el refresh falla con 401/403, la sesión ha expirado
            if (!response.success && (response.error.type === AuthErrorType.SESSION_EXPIRED || response.error.type === AuthErrorType.INVALID_CREDENTIALS)) {
                this.notifyExpiredListeners(response.error.message || 'SESSION_EXPIRED');
            }

            return response;
        } catch (error) {
            log.error('Refresh token failed', { error });
            return {
                success: false,
                error: {
                    type: AuthErrorType.SERVER_ERROR,
                    message: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }

    async getToken(): Promise<{ access: string | null; refresh: string | null }> {
        const session = await this.storage.getSession();
        return {
            access: session.access || null,
            refresh: session.refresh || null
        };
    }

    /**
     * Login con resiliencia offline.
     * Siempre intenta online primero para mantener los datos frescos.
     */
    async login(username: string, pin: string): Promise<AuthResult> {
        this.isLoggingIn = true;
        try {
            // 0. Pre-check de conectividad rápido (timeout de 3s para evitar bloqueos)
            const reachable = await isServerReachable(3000);

            if (reachable) {
                // 1. Intento Online
                const onlineResult = await this.api.login(username, pin);

                if (onlineResult.success && onlineResult.data) {
                    log.info('Online login successful, persisting session', { username });
                    await this.storage.saveSession(onlineResult.data);
                    await this.storage.saveOfflineCredentials(username, pin, onlineResult.data.user);
                    this.notifySessionListeners(onlineResult.data.user);
                    return onlineResult;
                }

                // Lógica Musashi: 
                // 1. Si el error es de identidad (401/403), no intentamos offline.
                if (!onlineResult.success && onlineResult.error.type === AuthErrorType.INVALID_CREDENTIALS) {
                    log.warn('Online login failed with domain error (Invalid Credentials)', onlineResult.error);
                    return onlineResult;
                }

                // 2. Si el error es del servidor (500), bloqueamos el acceso.
                // No podemos confiar en la sesión local si el servidor está inestable.
                if (!onlineResult.success && onlineResult.error.type === AuthErrorType.SERVER_ERROR) {
                    log.error('Online login failed due to Server Error (500), blocking access', onlineResult.error);
                    return onlineResult;
                }

                // 3. Verificación de integridad de tiempo antes de permitir fallback offline.
                // Si el reloj local es inconsistente, no podemos permitir el modo offline.
                const timeIntegrity = await TimerRepository.validateIntegrity(Date.now());
                if (timeIntegrity.status !== 'ok') {
                    log.error('Time integrity violation detected, blocking offline fallback', {
                        status: timeIntegrity.status,
                        reason: timeIntegrity.reason
                    });
                    return {
                        success: false,
                        error: {
                            type: AuthErrorType.UNKNOWN_ERROR,
                            message: 'Integridad de tiempo violada. Por favor sincronice su reloj o conecte a internet.'
                        }
                    };
                }

                // Para cualquier otro fallo (Red, etc.), activamos el modo de supervivencia offline.
                log.info('Online login failed due to connectivity, attempting offline validation', {
                    username,
                    errorType: !onlineResult.success ? onlineResult.error.type : 'N/A'
                });
                return await this.performOfflineValidation(username, pin);
            }

            // Si el servidor no es alcanzable, intentamos offline directamente pero validamos integridad de tiempo primero
            const timeIntegrity = await TimerRepository.validateIntegrity(Date.now());
            if (timeIntegrity.status !== 'ok') {
                log.error('Server unreachable and time integrity violation detected, blocking offline validation');
                return {
                    success: false,
                    error: {
                        type: AuthErrorType.UNKNOWN_ERROR,
                        message: 'No hay conexión y el reloj es inconsistente. Conecte a internet para resincronizar.'
                    }
                };
            }

            log.info('Server unreachable (fast-check), attempting offline validation', { username });
            return await this.performOfflineValidation(username, pin);

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

    private async performOfflineValidation(username: string, pin: string): Promise<AuthResult> {
        const offlineResult = await this.storage.validateOffline(username, pin);
        if (offlineResult.success && offlineResult.data) {
            this.notifySessionListeners(offlineResult.data.user);
        }
        return offlineResult;
    }

    async logout(): Promise<void> {
        if (this.isLoggingOut) {
            log.debug('Logout already in progress, skipping duplicate call');
            return;
        }
        this.isLoggingOut = true;
        try {
            log.info('Performing logout');
            // Intentamos notificar al servidor, pero no esperamos si falla
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
