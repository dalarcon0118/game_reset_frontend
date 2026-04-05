import { Result } from 'neverthrow';
import { AuthResult, AuthSession, User } from './types/types';
import { IDeviceSecretRepository, ITimeAnchorRepository } from '../crypto/crypto.ports';
import { ITimeRepository } from '../system/time';

/**
 * Interfaz para verificar condiciones antes de permitir login offline.
 * Inyectada por CoreModule para mantener AuthRepository desacoplado.
 */
export interface IOfflineConditionChecker {
    canContinueOffline(): Promise<boolean>;
}

export interface IAuthApi {
    login(username: string, pin: string): Promise<AuthResult>;
    logout(): Promise<void>;
    getMe(): Promise<User>;
    refresh(refreshToken: string): Promise<AuthResult>;
}

export interface IAuthRepository {
    login(username: string, pin: string): Promise<AuthResult>;
    logout(): Promise<void>;
    getUserIdentity(): Promise<User | null>;
    checkAuth(): Promise<void>;

    // Token management
    saveToken(access: string, refresh?: string, confirmationToken?: string, dailySecret?: string): Promise<void>;
    getToken(): Promise<{ access: string | null; refresh: string | null; confirmationToken?: string | null; dailySecret?: string | null; isOffline?: boolean }>;
    clearToken(): Promise<void>;

    onSessionChange(callback: (user: User | null) => void): () => void;
    onSessionExpired(callback: (reason: string) => void): () => void;
    onTokenRefreshed(callback: (token: string) => void): () => void;
    onRefreshTerminalFailed(callback: (error: string) => void): () => void;

    /** Notificación imperativa de expiración (puente para ApiClient) */
    notifySessionExpired(reason: string): void;

    getLastUsername(): Promise<string | null>;

    // Coordination
    resetExitFlag(): void;
    getIsExiting(): boolean;
    setExiting(value: boolean): void;
    hydrate(): Promise<User | null>;
    refreshUserProfile(): Promise<Result<User, Error>>;
    hasSession(): Promise<boolean>;

    /** Inyecta el sensor de red global del CoreModule */
    setNetworkStatus(isOnline: boolean): void;

    /** Inyecta el checker de condiciones offline del CoreModule */
    setOfflineConditionChecker(checker: IOfflineConditionChecker): void;

    /** Inyecta el repositorio de secretos de dispositivo */
    setDeviceSecretRepository(repo: IDeviceSecretRepository): void;

    /** Inyecta el repositorio de anclas de tiempo */
    setTimeAnchorRepository(repo: ITimeAnchorRepository): void;

    /** Inyecta el repositorio de tiempo (SSoT) */
    setTimeRepository(repo: ITimeRepository): void;
}

export interface IAuthStorage {
    // Session management
    saveSession(session: AuthSession): Promise<void>;
    getSession(): Promise<{ access: string | null; refresh: string | null; confirmationToken?: string | null; dailySecret?: string | null; timeAnchor?: any | null; isOffline?: boolean }>;
    clearSession(): Promise<void>;

    // Offline fallback management
    saveOfflineCredentials(username: string, pin: string, profile: User): Promise<void>;
    validateOffline(username: string, pin: string): Promise<AuthResult>;
    saveLastUsername(username: string): Promise<void>;
    getLastUsername(): Promise<string | null>;
    getUserProfile(): Promise<User | null>;
    getOfflineProfile(): Promise<User | null>;
    purgeLegacyData(): Promise<void>;
}
