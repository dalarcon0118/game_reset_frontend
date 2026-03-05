import { AuthResult, AuthSession, User } from './types/types';

export interface IAuthApi {
    login(username: string, pin: string): Promise<AuthResult>;
    logout(): Promise<void>;
    getMe(): Promise<User>;
}

export interface IAuthRepository {
    login(username: string, pin: string): Promise<AuthResult>;
    logout(): Promise<void>;
    getUserIdentity(): Promise<User | null>;
    checkAuth(): Promise<void>;
    // Token management
    saveToken(access: string, refresh?: string): Promise<void>;
    getToken(): Promise<{ access: string | null; refresh: string | null; isOffline?: boolean }>;
    clearToken(): Promise<void>;

    onSessionChange(callback: (user: User | null) => void): () => void;
    getLastUsername(): Promise<string | null>;
}

export interface IAuthStorage {
    // Session management
    saveSession(session: AuthSession): Promise<void>;
    getSession(): Promise<{ access: string | null; refresh: string | null; isOffline?: boolean }>;
    clearSession(): Promise<void>;

    // Offline fallback management
    saveOfflineCredentials(username: string, pin: string, profile: User): Promise<void>;
    validateOffline(username: string, pin: string): Promise<AuthResult>;
    saveLastUsername(username: string): Promise<void>;
    getLastUsername(): Promise<string | null>;
    getUserProfile(): Promise<User | null>;
}
