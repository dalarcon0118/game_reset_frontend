export interface UserStructure {
    id: number;
    name: string;
    type: string;
    path: string;
    role_in_structure: string;
    commission_rate?: number;
}

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
    // Nuevos códigos para errores específicos del backend
    DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
    DB_QUERY_ERROR = 'DB_QUERY_ERROR',
    INVALID_REQUEST = 'INVALID_REQUEST',
    INVALID_PIN_FORMAT = 'INVALID_PIN_FORMAT',
    CONFIRMATION_TOKEN_INVALID = 'CONFIRMATION_TOKEN_INVALID',
    USERNAME_TAKEN = 'USERNAME_TAKEN',
    EMAIL_TAKEN = 'EMAIL_TAKEN',
    ENDPOINT_DEPRECATED = 'ENDPOINT_DEPRECATED',
}

export type AuthError = {
    type: AuthErrorType;
    message: string;
    redirectTo?: string;
    backendCode?: string;
};

export type AuthResult =
    | { success: true; data: AuthSession; redirectTo?: string }
    | { success: false; error: AuthError };

export interface LocalCredentials {
    username: string;
    pinHash: string;
    profile: User;
}

export interface BackendLoginResponse {
    access: string;
    refresh?: string;
    confirmation_token?: string; // Nuevo campo para la estrategia
    daily_secret?: string; // Secreto diario para Zero Trust Fingerprint
    time_anchor?: {
        serverTime: number;
        signature: string;
        validUntil: number;
    };
    user: User;
}
