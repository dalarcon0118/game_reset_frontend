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
    DEVICE_LOCKED = 'DEVICE_LOCKED',
    CONNECTION_ERROR = 'CONNECTION_ERROR',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    SERVER_ERROR = 'SERVER_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    OFFLINE_NOT_ALLOWED = 'OFFLINE_NOT_ALLOWED',
}

export type AuthError = {
    type: AuthErrorType;
    message: string;
    redirectTo?: string;
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
