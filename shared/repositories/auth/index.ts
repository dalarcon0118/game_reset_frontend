import { Result, ResultAsync } from 'neverthrow';
import { authApiAdapter } from './adapters/auth.api.adapter';
import { authStorageAdapter } from './adapters/auth.storage.adapter';
import { IAuthApi, IAuthStorage, IAuthRepository, IOfflineConditionChecker } from './auth.ports';
import { AuthResult, User, AuthErrorType, isValidUser, selectBestUser } from './types/types';
import { AUTH_MESSAGES } from './auth.messages';
import { AUTH_ERROR_CODES } from './auth.error-codes';
import { logger } from '../../utils/logger';
import { setAuthRepository } from '../../services/api_client';
import { SessionPolicy } from '@/shared/auth/session/session.policy';
import { TokenState } from '@/shared/auth/session/session.types';
import { telemetryRepository } from '../system/telemetry';

import { IDeviceSecretRepository, ITimeAnchorRepository } from '../crypto/crypto.ports';
import { TimerRepository, ITimeRepository } from '../system/time';

const log = logger.withTag('AUTH_REPOSITORY');

export { AuthApi } from './api/api';
export * from './types/types';
export * from './codecs/codecs';
export * from './auth.ports';
export * from './auth.keys';
export * from './auth.messages';
export * from './auth.error-codes';
export * from './auth.error-mapper';

/**
 * AuthRepository - Orquestador agnóstico de autenticación y autorización.
 * Maneja flujos online, fallback offline y persistencia.
 * Refactored to follow SRP: No longer manages network connectivity.
 */
class AuthRepositoryImpl implements IAuthRepository {
    private sessionListeners: ((user: User | null) => void)[] = [];
    private expiredListeners: ((reason: string) => void)[] = [];
    private refreshedListeners: ((token: string) => void)[] = [];
    private refreshFailedListeners: ((error: string) => void)[] = [];
    private isLoggingIn = false; // Flag para evitar refresh durante login
    private isLoggingOut = false; // Flag para evitar race conditions durante logout
    private isExiting = false; // Flag para prevenir múltiples señales de expiración
    private isNetworkOnline = true; // SSoT: Estado de red global inyectado por CoreModule
    private networkChecker: (() => Promise<boolean>) | null = null; // Verificador de conectividad en tiempo real
    private offlineConditionChecker: IOfflineConditionChecker | null = null; // Inyectado por CoreModule
    private deviceSecretRepo: IDeviceSecretRepository | null = null;
    private timeAnchorRepo: ITimeAnchorRepository | null = null;
    private timeRepo: ITimeRepository;

    constructor(
        private api: IAuthApi = authApiAdapter,
        private storage: IAuthStorage = authStorageAdapter,
        timeRepo: ITimeRepository = TimerRepository
    ) {
        this.timeRepo = timeRepo;
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
     * Determina si es la primera autenticación del día.
     * Compara la fecha del último login con la fecha actual.
     */
    async isFirstAuthOfTheDay(): Promise<boolean> {
        const lastLoginDate = await this.storage.getLastLoginDate();
        const today = new Date().toISOString().split('T')[0];

        if (!lastLoginDate) {
            log.debug('isFirstAuthOfTheDay: No hay registro de último login - assuming first auth', {
                lastLoginDate,
                today
            });
            return true;
        }

        const isFirst = lastLoginDate !== today;
        log.debug('isFirstAuthOfTheDay result', { lastLoginDate, today, isFirst });
        return isFirst;
    }

    /**
     * Guarda la fecha del último login (se llama después de un login exitoso).
     */
    async markLoginDate(): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        await this.storage.saveLastLoginDate(today);
        log.info('Login date marked', { date: today });
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

            // Reintento rápido si hay token pero no perfil válido (evitar race conditions tras login)
            if (!isValidUser(user) && !isValidUser(offlineProfile) && session.access) {
                log.warn('Access token found but no valid user profile, retrying in 300ms...');
                await new Promise(resolve => setTimeout(resolve, 300));
                const retryUser = await this.storage.getUserProfile();
                if (isValidUser(retryUser)) {
                    log.info('Session hydrated after retry', { username: retryUser.username });
                    this.notifySessionListeners(retryUser);
                    return retryUser;
                }
            }

            const tokenState = SessionPolicy.resolveTokenState(session.access);

            // HARD-EXPIRED: Token expirado por más de 30 min -> forzar logout
            if (tokenState === TokenState.EXPIRED && session.access && SessionPolicy.isHardExpired(session.access)) {
                log.warn('Session token hard-expired, forcing logout', {
                    username: user?.username || offlineProfile?.username,
                    tokenState
                });
                this.notifySessionListeners(null);
                return null;
            }

            const isValid = tokenState === TokenState.VALID || tokenState === TokenState.EXPIRED || tokenState === TokenState.OFFLINE_MARKER;

            // DEFENSIVO: Validar que los perfiles tengan datos reales
            const isUserValid = isValidUser(user);
            const isOfflineValid = isValidUser(offlineProfile);

            if ((isUserValid || isOfflineValid) && isValid) {
                // DEFENSIVO: Usar selectBestUser que valida estructura
                const currentUser = selectBestUser(user, offlineProfile);

                if (!currentUser) {
                    log.warn('Both profiles invalid despite passing validation check');
                    this.notifySessionListeners(null);
                    return null;
                }

                const logMessage = tokenState === TokenState.VALID
                    ? 'Session hydrated successfully'
                    : tokenState === TokenState.EXPIRED
                        ? 'Session hydrated from cache (token expired, refresh pending)'
                        : 'Session hydrated from offline profile';

                log.info(logMessage, {
                    username: currentUser.username,
                    tokenState,
                    source: isUserValid ? 'active_profile' : 'offline_profile',
                    isUserValid,
                    isOfflineValid
                });

                this.notifySessionListeners(currentUser);
                return currentUser;
            }

            log.info('No active or valid session found during hydration', {
                hasUser: isUserValid,
                hasOffline: isOfflineValid,
                tokenState,
                userId: user?.id,
                userUsername: user?.username,
                offlineId: offlineProfile?.id,
                offlineUsername: offlineProfile?.username
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
                if (!user) throw new Error(AUTH_ERROR_CODES.FAILED_TO_GET_USER_PROFILE);

                const session = await this.storage.getSession();
                await this.storage.saveSession({
                    user,
                    accessToken: session.access!,
                    refreshToken: session.refresh!,
                    dailySecret: session.dailySecret || undefined,
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

    onRefreshTerminalFailed(callback: (error: string) => void): () => void {
        log.debug('Registering refresh terminal failed listener');
        this.refreshFailedListeners.push(callback);
        return () => {
            this.refreshFailedListeners = this.refreshFailedListeners.filter(cb => cb !== callback);
        };
    }

    onRefreshFailed(callback: (error: string) => void): () => void {
        return this.onRefreshTerminalFailed(callback);
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

    private notifyRefreshFailedListeners(error: string) {
        this.refreshFailedListeners.forEach(cb => cb(error));
    }

    async saveToken(access: string, refresh?: string, confirmationToken?: string, dailySecret?: string, timeAnchor?: any): Promise<void> {
        // DEFENSIVO: No usar || con objetos que pueden ser vacios
        const userProfile = await this.storage.getUserProfile();
        const offlineProfile = await this.storage.getOfflineProfile();
        const { confirmationToken: currentConfirmation, dailySecret: currentSecret, timeAnchor: currentAnchor } = await this.storage.getSession();

        // Seleccionar el mejor usuario disponible
        const user = selectBestUser(userProfile, offlineProfile);

        // LOG DIAGNOSTICO: Si el usuario es null o invalido, loguear warning
        if (!isValidUser(user)) {
            log.warn('saveToken: No valid user profile found for session save', {
                hasUserProfile: isValidUser(userProfile),
                hasOfflineProfile: isValidUser(offlineProfile),
                userProfileId: userProfile?.id,
                userProfileUsername: userProfile?.username,
                offlineProfileId: offlineProfile?.id,
                offlineProfileUsername: offlineProfile?.username
            });
            // NO guardar sesion sin usuario valido - esto causaria corrupcion
            // En su lugar, guardar sin el user pero loguear el error
            // El saveSession fallara si user es invalido
        }

        await this.storage.saveSession({
            accessToken: access,
            refreshToken: refresh,
            user: user || { id: 'unknown', username: '', name: '', email: '', role: '', active: false },
            isOffline: false,
            confirmationToken: confirmationToken || currentConfirmation || undefined,
            dailySecret: dailySecret || currentSecret || undefined,
            timeAnchor: timeAnchor || currentAnchor || undefined
        });
    }

    async clearToken(): Promise<void> {
        await this.storage.clearSession();
    }

    async refresh(): Promise<AuthResult> {
        const { refresh } = await this.getToken();
        if (!refresh) {
            this.notifyExpiredListeners(AUTH_ERROR_CODES.NO_REFRESH_TOKEN);
            return {
                success: false,
                error: {
                    type: AuthErrorType.SESSION_EXPIRED,
                    message: AUTH_ERROR_CODES.NO_REFRESH_TOKEN
                }
            };
        }

        try {
            const response = await this.api.refresh(refresh);
            if (response.success && response.data) {
                const { accessToken, refreshToken: newRefresh, user: freshUser, confirmationToken, dailySecret } = response.data;
                const storedProfile = await this.storage.getUserProfile();
                const offlineProfile = await this.storage.getOfflineProfile();
                const { confirmationToken: currentConfirmation, dailySecret: currentSecret } = await this.storage.getSession();

                // DEFENSIVO: Seleccionar el mejor usuario usando validacion
                const user = selectBestUser(freshUser, selectBestUser(storedProfile, offlineProfile));

                await this.storage.saveSession({
                    accessToken,
                    refreshToken: newRefresh || refresh,
                    user: isValidUser(user) ? user : (isValidUser(storedProfile) ? storedProfile : offlineProfile),
                    isOffline: false,
                    confirmationToken: confirmationToken || currentConfirmation || undefined,
                    dailySecret: dailySecret || currentSecret || undefined
                });

                this.notifyRefreshedListeners(accessToken);

                if (isValidUser(user)) {
                    this.notifySessionListeners(user);
                } else {
                    log.warn('Refresh: No valid user to notify', { 
                        hasFreshUser: isValidUser(freshUser),
                        hasStoredProfile: isValidUser(storedProfile),
                        hasOfflineProfile: isValidUser(offlineProfile)
                    });
                }

                return response;
            }

            // Si el refresh falla con 401/403, la sesión ha expirado
            if (!response.success && response.error && (response.error.type === AuthErrorType.SESSION_EXPIRED || response.error.type === AuthErrorType.INVALID_CREDENTIALS)) {
                this.notifyRefreshFailedListeners(response.error.message || AUTH_ERROR_CODES.TERMINAL_REFRESH_FAILURE);
                this.notifyExpiredListeners(response.error.message || AUTH_ERROR_CODES.SESSION_EXPIRED);
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

    async getToken(): Promise<{ access: string | null; refresh: string | null; confirmationToken?: string | null; dailySecret?: string | null; isOffline?: boolean }> {
        const session = await this.storage.getSession();
        return {
            access: session.access || null,
            refresh: session.refresh || null,
            confirmationToken: session.confirmationToken || null,
            dailySecret: session.dailySecret || null,
            isOffline: session.isOffline
        };
    }

    /**
     * Login con resiliencia offline.
     * Siempre intenta online primero para mantener los datos frescos.
     */
    async login(username: string, pin: string): Promise<AuthResult> {
        try {
            // 1. Evaluar conectividad en tiempo real antes de decidir estrategia
            // Si el sensor global dice OFFLINE pero tenemos checker, verificamos realmente
            let shouldAttemptOnline = this.isNetworkOnline;

            if (!this.isNetworkOnline && this.networkChecker) {
                log.info('Global sensor says OFFLINE but networkChecker available - verifying real connectivity...');
                const isReachable = await this.networkChecker();
                shouldAttemptOnline = isReachable;
                log.info('Real-time connectivity check result', { isReachable, wasGlobalSensorOffline: true });
            }

            log.info('Evaluating login strategy...', { username, isNetworkOnline: this.isNetworkOnline, shouldAttemptOnline });

            if (shouldAttemptOnline) {
                log.info('Attempting online login (Network is ONLINE)...', { username });
                const onlineResult = await this.api.login(username, pin);

                if (onlineResult.success && onlineResult.data) {
                    log.info('Online login successful, persisting session', { username });
                    await this.storage.saveSession(onlineResult.data);
                    await this.storage.saveOfflineCredentials(username, pin, onlineResult.data.user);

                    telemetryRepository.captureAuthLoginSuccess(username, false).catch(err => {
                        log.warn('[AUTH_TELEMETRY] Failed to capture login success', err);
                    });

                    // FASE 1 Zero Trust: Propagar el secreto y el anchor al módulo criptográfico
                    if (onlineResult.data.dailySecret && this.deviceSecretRepo) {
                        log.info('[AUTH_REPO] Saving dailySecret to DeviceSecretRepository', {
                            dailySecret: onlineResult.data.dailySecret.substring(0, 10) + '...',
                            hasDeviceSecretRepo: !!this.deviceSecretRepo
                        });
                        this.deviceSecretRepo.saveDailySecret(onlineResult.data.dailySecret).fork().then(
                            res => {
                                if (res.isErr()) {
                                    log.error('[AUTH_REPO] Failed to save daily secret', res.error);
                                } else {
                                    log.info('[AUTH_REPO] Daily secret saved successfully', { secret: res.value.substring(0, 10) + '...' });
                                }
                            }
                        );
                    } else if (onlineResult.data.dailySecret) {
                        log.error('[AUTH_REPO] Cannot save daily secret: DeviceSecretRepository not injected');
                    } else {
                        log.warn('[AUTH_REPO] No dailySecret in onlineResult.data - backend did not send it');
                    }

                    if (onlineResult.data.timeAnchor && this.timeAnchorRepo) {
                        this.timeAnchorRepo.saveAnchor(onlineResult.data.timeAnchor).fork().then(
                            res => { if (res.isErr()) log.error('Failed to save time anchor', res.error); }
                        );
                    } else if (onlineResult.data.timeAnchor) {
                        log.error('Cannot save time anchor: TimeAnchorRepository not injected');
                    }

                    // Marcar fecha de login después de éxito
                    await this.markLoginDate();

                    // FIX: After login, fetch fresh user profile to ensure commission_rate is correct
                    // This prevents race conditions where cached profile with wrong commission_rate
                    // is used before the fresh profile is fetched
                    // Note: refreshUserProfile() already calls notifySessionListeners internally
                    try {
                        const refreshResult = await this.refreshUserProfile();
                        if (refreshResult.isOk()) {
                            // refreshUserProfile already notified via notifySessionListeners
                            return onlineResult;
                        }
                    } catch (refreshError) {
                        log.warn('[AUTH_REPO] Failed to refresh user profile after login, using onlineResult user', refreshError);
                    }

                    this.notifySessionListeners(onlineResult.data.user);
                    return onlineResult;
                }

                // 2. Analizar el fallo online
                if (!onlineResult.success && onlineResult.error) {
                    const error = onlineResult.error;

                    log.warn('Online login failed, evaluating fallback policy', {
                        type: error.type,
                        message: error.message,
                        backendCode: error.backendCode
                    });

                    // ERRORES QUE SIEMPRE BLOQUEAN OFFLINE (el servidor respondió con error HTTP):
                    // - Credenciales inválidas: el servidor está activo pero el usuario no es válido
                    // - Dispositivo bloqueado: el servidor está activo pero el dispositivo no coincide
                    // - Sesión expirada: el servidor está activo pero el token es inválido
                    // - Errores de servidor (5xx): el servidor está activo pero tiene problemas internos
                    const shouldBlockOffline =
                        error.type === AuthErrorType.INVALID_CREDENTIALS ||
                        error.type === AuthErrorType.DEVICE_LOCKED ||
                        error.type === AuthErrorType.SESSION_EXPIRED ||
                        error.type === AuthErrorType.SERVER_ERROR;

                    if (shouldBlockOffline) {
                        log.error('Blocking offline fallback: server responded with definitive error', {
                            type: error.type,
                            message: error.message,
                            backendCode: error.backendCode
                        });
                        telemetryRepository.captureAuthError(
                            error.type,
                            error.message,
                            {
                                feature: 'AUTH',
                                errorType: error.type,
                                backendCode: error.backendCode,
                                username,
                                offlineAttempt: false,
                                offlineSuccess: false
                            }
                        ).catch(err => {
                            log.warn('[AUTH_TELEMETRY] Failed to capture auth error', err);
                        });
                        return onlineResult;
                    }

                    // ERROR DE CONEXIÓN (network error, status=0):
                    // El servidor NO respondió, lo que significa que está offline o inalcanzable.
                    // IMPORTANTE: Diferenciar entre error de conexión vs offline físico
                    if (error.type === AuthErrorType.CONNECTION_ERROR) {
                        log.info('Connection error detected - server unreachable. Evaluating auth strategy...', {
                            isNetworkOnline: this.isNetworkOnline,
                            isFirstAuth: await this.isFirstAuthOfTheDay()
                        });

                        // CASO 1: Primera autenticación del día + error de conexión
                        // → Requiere conexión para cargar los sorteos del día
                        const isFirstAuth = await this.isFirstAuthOfTheDay();
                        if (isFirstAuth) {
                            log.error('First auth of the day failed - server unreachable. Blocking offline fallback.', {
                                username,
                                isFirstAuth
                            });
                            telemetryRepository.captureAuthError(
                                AuthErrorType.CONNECTION_ERROR_FIRST_AUTH,
                                AUTH_MESSAGES.CONNECTION_ERROR_FIRST_AUTH,
                                {
                                    feature: 'AUTH',
                                    errorType: AuthErrorType.CONNECTION_ERROR_FIRST_AUTH,
                                    username,
                                    offlineAttempt: false,
                                    offlineSuccess: false
                                }
                            ).catch(err => {
                                log.warn('[AUTH_TELEMETRY] Failed to capture auth error', err);
                            });
                            return {
                                success: false,
                                error: {
                                    type: AuthErrorType.CONNECTION_ERROR_FIRST_AUTH,
                                    message: AUTH_MESSAGES.CONNECTION_ERROR_FIRST_AUTH
                                }
                            };
                        }

                        // CASO 2: No es primera auth → verificar si hay sorteos locales
                        // Si no hay sorteos locales, mostrar error específico
                        log.info('Not first auth of the day - checking for local draws...', {
                            isFirstAuth: false
                        });
                        // Continuar a la lógica de offline que verifica cache local
                    } else {
                        // Cualquier otro error no manejado también bloquea offline
                        log.error('Blocking offline fallback: unhandled error type', {
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
                isNetworkOnline: this.isNetworkOnline,
                shouldAttemptOnline
            });

            const timeIntegrity = this.timeRepo.validateIntegrity(Date.now());
            if (timeIntegrity.status !== 'ok') {
                log.error('Time integrity violation! Survival mode denied', {
                    status: timeIntegrity.status,
                    reason: (timeIntegrity as any).reason
                });
                telemetryRepository.captureAuthError(
                    'TIME_INTEGRITY_VIOLATION',
                    AUTH_MESSAGES.TIME_INTEGRITY_VIOLATION,
                    {
                        feature: 'AUTH',
                        errorType: 'TIME_INTEGRITY_VIOLATION',
                        username,
                        offlineAttempt: true,
                        offlineSuccess: false,
                        extra: { timeIntegrityStatus: timeIntegrity.status }
                    },
                    'CRITICAL'
                ).catch(err => {
                    log.warn('[AUTH_TELEMETRY] Failed to capture time integrity error', err);
                });
                return {
                    success: false,
                    error: {
                        type: AuthErrorType.UNKNOWN_ERROR,
                        message: AUTH_MESSAGES.TIME_INTEGRITY_VIOLATION
                    }
                };
            }

            // 4. Verificar condiciones adicionales antes de permitir login offline
            // FAIL-SAFE: Si no hay checker configurado, denegar offline por defecto
            if (!this.offlineConditionChecker) {
                log.error('Offline condition checker NOT configured - blocking offline login for safety');
                return {
                    success: false,
                    error: {
                        type: AuthErrorType.OFFLINE_NOT_ALLOWED,
                        message: AUTH_MESSAGES.OFFLINE_CONDITION_CHECKER_MISSING
                    }
                };
            }

            // Si shouldAttemptOnline es false (sensor dice offline) o tuvimos CONNECTION_ERROR,
            // entonces sabemos que el servidor no está reachable y NO debemos intentar fetch remoto
            const skipRemoteFetch = !shouldAttemptOnline;

            log.info('Checking offline conditions for survival mode', {
                username,
                skipRemoteFetch,
                isNetworkOnline: this.isNetworkOnline,
                shouldAttemptOnline
            });

            const canContinueOffline = await this.offlineConditionChecker.canContinueOffline(skipRemoteFetch);
            if (!canContinueOffline) {
                log.warn('Offline login blocked - no draws available in cache');
                telemetryRepository.captureAuthOfflineFallback(username, false, 'NO_DRAWS_AVAILABLE').catch(err => {
                    log.warn('[AUTH_TELEMETRY] Failed to capture offline fallback failure', err);
                });
                return {
                    success: false,
                    error: {
                        type: AuthErrorType.OFFLINE_NO_DRAWS,
                        message: AUTH_MESSAGES.OFFLINE_NO_DRAWS
                    }
                };
            }

            // 5. Intentar validación offline como modo de supervivencia
            log.info('Proceeding to survival mode (offline validation)', { username });
            return await this.performOfflineValidation(username, pin, skipRemoteFetch);

        } catch (error: any) {
            log.error('CRITICAL: Unexpected error during login orchestration', error);
            return {
                success: false,
                error: {
                    type: AuthErrorType.UNKNOWN_ERROR,
                    message: AUTH_MESSAGES.UNEXPECTED_ERROR
                }
            };
        }
    }

    private async performOfflineValidation(username: string, pin: string, skipRemoteFetch: boolean = false): Promise<AuthResult> {
        const offlineResult = await this.storage.validateOffline(username, pin);
        if (!offlineResult.success || !offlineResult.data) {
            telemetryRepository.captureAuthOfflineFallback(username, false, 'INVALID_CREDENTIALS').catch(err => {
                log.warn('[AUTH_TELEMETRY] Failed to capture offline validation failure', err);
            });
            return offlineResult;
        }

        const userStructureId = offlineResult.data.user.structure?.id;
        if (!userStructureId) {
            log.warn('performOfflineValidation: Usuario sin estructura - denegando login offline', { username });
            telemetryRepository.captureAuthOfflineFallback(username, false, 'NO_STRUCTURE').catch(err => {
                log.warn('[AUTH_TELEMETRY] Failed to capture offline validation failure', err);
            });
            return {
                success: false,
                error: {
                    type: AuthErrorType.OFFLINE_NOT_ALLOWED,
                    message: AUTH_MESSAGES.OFFLINE_USER_NO_STRUCTURE
                }
            };
        }

        const structureId = Number(userStructureId);

        if (!this.offlineConditionChecker) {
            log.error('performOfflineValidation: Offline condition checker not configured');
            return {
                success: false,
                error: {
                    type: AuthErrorType.OFFLINE_NOT_ALLOWED,
                    message: AUTH_MESSAGES.OFFLINE_CONDITION_CHECKER_MISSING
                }
            };
        }

        const canContinueOffline = await this.offlineConditionChecker.canContinueOfflineForStructure(structureId, skipRemoteFetch);
        if (!canContinueOffline) {
            log.warn('performOfflineValidation: No hay sorteos para la estructura - denegando login offline', {
                username,
                structureId,
                skipRemoteFetch
            });
            telemetryRepository.captureAuthOfflineFallback(username, false, 'NO_DRAWS_FOR_STRUCTURE').catch(err => {
                log.warn('[AUTH_TELEMETRY] Failed to capture offline validation failure', err);
            });
            return {
                success: false,
                error: {
                    type: AuthErrorType.OFFLINE_NOT_ALLOWED,
                    message: AUTH_MESSAGES.OFFLINE_NO_DRAWS_FOR_STRUCTURE
                }
            };
        }

        await this.storage.saveSession({
            user: offlineResult.data.user,
            accessToken: offlineResult.data.accessToken || 'offline-token',
            refreshToken: offlineResult.data.refreshToken,
            confirmationToken: undefined,
            isOffline: true
        });

        // Marcar fecha de login después de éxito offline
        await this.markLoginDate();

        this.notifySessionListeners(offlineResult.data.user);

        telemetryRepository.captureAuthLoginSuccess(username, true).catch(err => {
            log.warn('[AUTH_TELEMETRY] Failed to capture offline login success', err);
        });

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
            // Notificar al servidor ANTES de limpiar la sesión
            // IMPORTANTE: El token debe existir cuando se envía la request de logout
            // para que el backend pueda identificar al usuario en los logs
            try {
                await this.api.logout();
                log.info('Remote logout successful');
            } catch (err) {
                log.warn('Remote logout failed, continuing with local logout', err);
            }

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

    async getOfflineProfile(): Promise<User | null> {
        return await this.storage.getOfflineProfile();
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

    /** Inyecta el verificador de conectividad en tiempo real (ping al servidor) */
    setNetworkChecker(checker: () => Promise<boolean>): void {
        this.networkChecker = checker;
        log.info('[SSOT-SYNC] Network checker injected into AuthRepository');
    }

    /** Inyecta el checker de condiciones offline del CoreModule */
    setOfflineConditionChecker(checker: IOfflineConditionChecker): void {
        this.offlineConditionChecker = checker;
        log.info('[SSOT-SYNC] Offline condition checker injected into AuthRepository');
    }

    /** Inyecta el repositorio de secretos de dispositivo */
    setDeviceSecretRepository(repo: IDeviceSecretRepository): void {
        this.deviceSecretRepo = repo;
        log.info('[SSOT-SYNC] DeviceSecretRepository injected into AuthRepository');
    }

    /** Inyecta el repositorio de anclas de tiempo */
    setTimeAnchorRepository(repo: ITimeAnchorRepository): void {
        this.timeAnchorRepo = repo;
        log.info('[SSOT-SYNC] TimeAnchorRepository injected into AuthRepository');
    }

    /** Inyecta el repositorio de tiempo (SSoT) */
    setTimeRepository(repo: ITimeRepository): void {
        this.timeRepo = repo;
        log.info('[SSOT-SYNC] TimeRepository (SSoT) injected into AuthRepository');
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
