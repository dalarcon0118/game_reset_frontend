import { createCommissionRate } from '../../../domain/commission.rate';

export interface UserStructure {
    id: number;
    name: string;
    type: string;
    path: string;
    role_in_structure: string;
    commission_rate?: number;
}

export interface UserStructureNormalized {
    id: number;
    name: string;
    type: string;
    path: string;
    role_in_structure: string;
    commission_rate: number;
}

export const normalizeUserStructure = (raw: UserStructure): UserStructureNormalized => ({
    ...raw,
    commission_rate: createCommissionRate(raw.commission_rate)
});

export interface User {
    id: string | number;
    username: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    password?: string;
    needs_pin_change?: boolean;
    structure?: UserStructure;
}

/**
 * Valida que un objeto User tenga los campos mínimos requeridos.
 * IMPORTANTE: {} es truthy en JavaScript, por lo que necesitamos
 * validar la estructura antes de usarlo.
 */
export function isValidUser(user: unknown): user is User {
    if (!user || typeof user !== 'object') return false;
    const u = user as Record<string, unknown>;
    return Boolean(u.id != null && u.username != null && typeof u.username === 'string' && u.username.length > 0);
}

/**
 * Selecciona el mejor usuario disponible entre userProfile y offlineProfile.
 * Prioriza userProfile si es válido, si no usa offlineProfile.
 */
export function selectBestUser<T extends User | null>(userProfile: T, offlineProfile: T): T {
    if (isValidUser(userProfile)) return userProfile;
    if (isValidUser(offlineProfile)) return offlineProfile;
    return null as T;
}

export interface AuthSession {
    user: User;
    accessToken: string;
    refreshToken?: string;
    confirmationToken?: string;
    dailySecret?: string;
    timeAnchor?: {
        serverTime: number;
        signature: string;
        validUntil: number;
    };
    needs_pin_change?: boolean;
    isOffline: boolean;
}

export enum AuthErrorType {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    INVALID_PIN = 'INVALID_PIN',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    DEVICE_LOCKED = 'DEVICE_LOCKED',
    DEVICE_ID_REQUIRED = 'DEVICE_ID_REQUIRED',
    CONNECTION_ERROR = 'CONNECTION_ERROR',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    SERVER_ERROR = 'SERVER_ERROR',
    ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    OFFLINE_NOT_ALLOWED = 'OFFLINE_NOT_ALLOWED',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    CONNECTION_ERROR_FIRST_AUTH = 'CONNECTION_ERROR_FIRST_AUTH',
    OFFLINE_NO_DRAWS = 'OFFLINE_NO_DRAWS',
    DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
    DB_QUERY_ERROR = 'DB_QUERY_ERROR',
    INVALID_REQUEST = 'INVALID_REQUEST',
    INVALID_PIN_FORMAT = 'INVALID_PIN_FORMAT',
    CONFIRMATION_TOKEN_INVALID = 'CONFIRMATION_TOKEN_INVALID',
    USERNAME_TAKEN = 'USERNAME_TAKEN',
    OFFLINE_NO_DRAWS_FOR_STRUCTURE = 'OFFLINE_NO_DRAWS_FOR_STRUCTURE',
    OFFLINE_USER_NO_STRUCTURE = 'OFFLINE_USER_NO_STRUCTURE',
    TIME_INTEGRITY_VIOLATION = 'TIME_INTEGRITY_VIOLATION',
    OFFLINE_CONDITION_CHECKER_MISSING = 'OFFLINE_CONDITION_CHECKER_MISSING',
    UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

export interface AuthError {
    type: AuthErrorType;
    message?: string;
    backendCode?: string;
}

export interface BackendLoginResponse extends AuthSession {
    user: User;
}

export interface AuthResult {
    success: boolean;
    data?: BackendLoginResponse;
    error?: AuthError;
    errorMessage?: string;
}
