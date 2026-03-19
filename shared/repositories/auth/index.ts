import { Result, ResultAsync } from 'neverthrow';
import { authApiAdapter } from './adapters/auth.api.adapter';
import { authStorageAdapter } from './adapters/auth.storage.adapter';
import { IAuthApi, IAuthStorage, IAuthRepository } from './auth.ports';
import { AuthResult, User, AuthErrorType } from './types/types';
import { logger } from '../../utils/logger';
import { setAuthRepository } from '../../services/api_client';
import { SessionPolicy } from '@/shared/auth/session/session.policy';
import { TokenState } from '@/shared/auth/session/session.types';

import { TimerRepository, ITimeRepository } from '../system/time';

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
    private isNetworkOnline = true; // SSoT: Estado de red global inyectado por CoreModule

    constructor(
        private api: IAuthApi = authApiAdapter,
        private storage: IAuthStorage = authStorageAdapter,
        private timeRepo: ITimeRepository = TimerRepository
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

            // Estricto SSOT: Limpiar datos obsoletos que causaban bloqueos
            await this.storage.purgeLegacyData();

            const user = await this.storage.getUserProfile();
            const offlineProfile = await this.storage.getOfflineProfile();
            const session = await this.storage.getSession();

            // Reintento rápido si hay token pero no perfil (evitar race conditions tras login)
            if (!user && !offlineProfile && session.access) {
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

            if ((user || offlineProfile) && isValid) {
                const currentUser = user || offlineProfile!;
                log.info('Session hydrated successfully', {
                    username: currentUser.username,
                    tokenState,
                    source: user ? 'active_profile' : 'offline_profile'
                });

                this.notifySessionListeners(currentUser);
                return currentUser;
            }

            log.info('No active or valid session found during hydration', {
                hasUser: !!user,
                hasOffline: !!offlineProfile,
                tokenState
            });
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

    async saveToken(access: string, refresh?: string, confirmationToken?: string): Promise<void> {
        const user = (await this.storage.getUserProfile()) || ({} as User);
        const { confirmationToken: currentConfirmation } = await this.storage.getSession();
        await this.storage.saveSession({
            accessToken: access,
            refreshToken: refresh,
            user,
            isOffline: false,
            confirmationToken: confirmationToken || currentConfirmation || undefined
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
                const { accessToken, refreshToken: newRefresh, user, confirmationToken } = response.data;
                const currentUser = (await this.storage.getUserProfile()) || ({} as User);
                const { confirmationToken: currentConfirmation } = await this.storage.getSession();

                await this.storage.saveSession({
                    accessToken,
                    refreshToken: newRefresh || refresh,
                    user: user || currentUser,
                    isOffline: false,
                    confirmationToken: confirmationToken || currentConfirmation || undefined
                });

                this.notifyRefreshedListeners(accessToken);

                if (user || currentUser.id) {
                    this.notifySessionListeners(user || currentUser);
                }

                return response;
            }

            // Si el refresh falla con 401/403, la sesión ha expirado
            if (!response.success && response.error && (response.error.type === AuthErrorType.SESSION_EXPIRED || response.error.type === AuthErrorType.INVALID_CREDENTIALS)) {
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

    async getToken(): Promise<{ access: string | null; refresh: string | null; confirmationToken?: string | null; isOffline?: boolean }> {
        const session = await this.storage.getSession();
        return {
            access: session.access || null,
            refresh: session.refresh || null,
            confirmationToken: session.confirmationToken || null,
            isOffline: session.isOffline
        };
    }

    /**
     * Login con resiliencia offline.
     * Siempre intenta online primero para mantener los datos frescos.
     */
    async login(username: string, pin: string): Promise<AuthResult> {
        try {
            // 1. Siempre intentar online primero si el sensor de red global lo permite
            log.info('Evaluating login strategy...', { username, isNetworkOnline: this.isNetworkOnline });

            if (this.isNetworkOnline) {
                log.info('Attempting online login (Network is ONLINE)...', { username });
                const onlineResult = await this.api.login(username, pin);

                if (onlineResult.success && onlineResult.data) {
                    log.info('Online login successful, persisting session', { username });
                    await this.storage.saveSession(onlineResult.data);
                    await this.storage.saveOfflineCredentials(username, pin, onlineResult.data.user);
                    this.notifySessionListeners(onlineResult.data.user);
                    return onlineResult;
                }

                // 2. Analizar el fallo online
                if (!onlineResult.success && onlineResult.error) {
                    const error = onlineResult.error;

                    log.warn('Online login failed, evaluating fallback policy', {
                        type: error.type,
                        message: error.message
                    });

                    // Si es un error de seguridad o de servidor (500), NO permitimos fallback offline.
                    // Esto asegura que si el servidor está "vivo" pero con errores, no entremos en modo offline.
                    const shouldBlockOffline =
                        error.type === AuthErrorType.INVALID_CREDENTIALS ||
                        error.type === AuthErrorType.DEVICE_LOCKED ||
                        error.type === AuthErrorType.SESSION_EXPIRED ||
                        error.type === AuthErrorType.SERVER_ERROR;

                    if (shouldBlockOffline) {
                        log.error('Blocking offline fallback: definitive server response or security error', {
                            type: error.type,
                            message: error.message
                        });
                        return onlineResult;
                    }
                }
            } else {
                log.warn('Network is OFFLINE according to global sensor, skipping online attempt');
            }

            // 3. Si llegamos aquí, es un error de conexión (timeout, red caída, etc.) o el sensor global reportó OFFLINE
            // Antes de permitir fallback offline, verificamos integridad de tiempo.
            log.info('Connectivity issue or OFFLINE state detected, validating time integrity for survival mode', {
                username,
                isNetworkOnline: this.isNetworkOnline
            });

            const timeIntegrity = this.timeRepo.validateIntegrity(Date.now());
            if (timeIntegrity.status !== 'ok') {
                log.error('Time integrity violation! Survival mode denied', {
                    status: timeIntegrity.status,
                    reason: (timeIntegrity as any).reason
                });
                return {
                    success: false,
                    error: {
                        type: AuthErrorType.UNKNOWN_ERROR,
                        message: 'Integridad de tiempo violada. Por favor sincronice su reloj o conecte a internet.'
                    }
                };
            }

            // 4. Intentar validación offline como modo de supervivencia
            log.info('Proceeding to survival mode (offline validation)', { username });
            return await this.performOfflineValidation(username, pin);

        } catch (error: any) {
            log.error('CRITICAL: Unexpected error during login orchestration', error);
            return {
                success: false,
                error: {
                    type: AuthErrorType.UNKNOWN_ERROR,
                    message: error.message || 'Error inesperado en el sistema'
                }
            };
        }
    }

    private async performOfflineValidation(username: string, pin: string): Promise<AuthResult> {
        const offlineResult = await this.storage.validateOffline(username, pin);
        if (offlineResult.success && offlineResult.data) {
            // Save the offline session to SecureStore so subsequent hydration can find it
            await this.storage.saveSession({
                user: offlineResult.data.user,
                accessToken: offlineResult.data.accessToken || 'offline-token',
                refreshToken: offlineResult.data.refreshToken,
                confirmationToken: undefined,
                isOffline: true
            });
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

    /** Inyecta el sensor de red global del CoreModule */
    setNetworkStatus(isOnline: boolean): void {
        if (this.isNetworkOnline !== isOnline) {
            log.info(`[SSOT-SYNC] Global network status updated in AuthRepository: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
            this.isNetworkOnline = isOnline;
        }
    }

    async checkAuth(): Promise<void> {
        const hasSession = await this.hasSession();
        if (!hasSession) {
            this.notifySessionListeners(null);
            throw new Error('No active session');
        }
    }

    /**
     * Retorna el último nombre de usuario conocido, priorizando la sesión activa
     * y cayendo (fallback) al perfil offline si no hay sesión.
     */
    async getLastUsername(): Promise<string | null> {
        try {
            // 1. Intentar de la sesión/perfil activo primero
            const activeProfile = await this.storage.getUserProfile();
            if (activeProfile?.username) {
                log.debug('Using username from active profile', { username: activeProfile.username });
                return activeProfile.username;
            }

            // 2. Intentar del rastro del último usuario guardado explícitamente
            const lastUser = await this.storage.getLastUsername();
            if (lastUser) {
                log.debug('Using username from last_username record', { username: lastUser });
                return lastUser;
            }

            // 3. Fallback final al perfil offline
            const offlineProfile = await this.storage.getOfflineProfile();
            if (offlineProfile?.username) {
                log.debug('Using username from offline profile fallback', { username: offlineProfile.username });
                return offlineProfile.username;
            }

            return null;
        } catch (error) {
            log.error('Error retrieving last username from repository', error);
            return null;
        }
    }

    async saveLastUsername(username: string): Promise<void> {
        await this.storage.saveLastUsername(username);
    }
}

// Exportamos una instancia única por defecto
export const AuthRepository = new AuthRepositoryImpl();

// Inyectamos la dependencia circular
setAuthRepository(AuthRepository);
