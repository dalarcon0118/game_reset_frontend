import { AuthErrorType } from './types/types';
import { AUTH_MESSAGES } from './auth.messages';
import { AUTH_LOGS } from './auth.constants';

export const AUTH_BACKEND_ERROR_CODES = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    INVALID_PIN: 'INVALID_PIN',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    DEVICE_LOCKED: 'DEVICE_LOCKED',
    DEVICE_ID_REQUIRED: 'DEVICE_ID_REQUIRED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
    DB_QUERY_ERROR: 'DB_QUERY_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    INVALID_REQUEST: 'INVALID_REQUEST',
    INVALID_PIN_FORMAT: 'INVALID_PIN_FORMAT',
    CONFIRMATION_TOKEN_INVALID: 'CONFIRMATION_TOKEN_INVALID',
    USERNAME_TAKEN: 'USERNAME_TAKEN',
    EMAIL_TAKEN: 'EMAIL_TAKEN',
    ENDPOINT_DEPRECATED: 'ENDPOINT_DEPRECATED',
} as const;

export type AuthBackendErrorCode = (typeof AUTH_BACKEND_ERROR_CODES)[keyof typeof AUTH_BACKEND_ERROR_CODES];

export interface AuthBackendError {
    code: AuthBackendErrorCode;
    status: number;
    message: string;
    isTechnical: boolean;
    details?: Record<string, unknown>;
}

export interface BackendErrorResponse {
    code?: string;
    message?: string;
    detail?: string;
    status?: number;
    error_type?: string;
    [key: string]: unknown;
}

export function extractBackendErrorCode(errorData: BackendErrorResponse | null): string | null {
    if (!errorData) return null;
    return errorData.code || errorData.error_type || null;
}

export function createAuthBackendError(
    status: number, 
    rawMessage: string | undefined,
    backendCode?: string | null
): AuthBackendError {
    const isNetworkError = !status;

    const isServerError = status >= 500;
    const isInvalidCredentials = status === 401;
    const isDeviceLocked = status === 403;
    const isSessionExpired = status === 401;
    const isAccountLocked = status === 423;
    const isRateLimited = status === 429;

    if (isNetworkError) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.NETWORK_ERROR,
            status,
            message: AUTH_MESSAGES.CONNECTION_ERROR,
            isTechnical: false
        };
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.DB_CONNECTION_ERROR || backendCode === 'DB_CONNECTION_ERROR') {
        return {
            code: AUTH_BACKEND_ERROR_CODES.DB_CONNECTION_ERROR,
            status,
            message: 'No se puede conectar a la base de datos. Por favor, intenta más tarde.',
            isTechnical: true
        };
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.DB_QUERY_ERROR || backendCode === 'DB_QUERY_ERROR') {
        return {
            code: AUTH_BACKEND_ERROR_CODES.DB_QUERY_ERROR,
            status,
            message: 'Error al procesar datos. Por favor, intenta más tarde.',
            isTechnical: true
        };
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.RATE_LIMIT_EXCEEDED || backendCode === 'RATE_LIMIT_EXCEEDED' || isRateLimited) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            status,
            message: 'Demasiados intentos. Por favor, espera un momento.',
            isTechnical: false
        };
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.ACCOUNT_LOCKED || isAccountLocked) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.ACCOUNT_LOCKED,
            status,
            message: rawMessage || AUTH_MESSAGES.ACCOUNT_LOCKED,
            isTechnical: false
        };
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.DEVICE_ID_REQUIRED || backendCode === 'DEVICE_ID_REQUIRED') {
        return {
            code: AUTH_BACKEND_ERROR_CODES.DEVICE_ID_REQUIRED,
            status,
            message: 'Se requiere identificación de dispositivo.',
            isTechnical: false
        };
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.DEVICE_LOCKED || isDeviceLocked) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.DEVICE_LOCKED,
            status,
            message: rawMessage || AUTH_MESSAGES.DEVICE_LOCKED,
            isTechnical: false
        };
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.SESSION_EXPIRED || isSessionExpired) {
        const rawLower = rawMessage?.toLowerCase() || '';
        if (rawLower.includes('session') || rawLower.includes('expired')) {
            return {
                code: AUTH_BACKEND_ERROR_CODES.SESSION_EXPIRED,
                status,
                message: rawMessage || 'Sesión expirada',
                isTechnical: false
            };
        }
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.USER_NOT_FOUND || rawMessage?.toLowerCase().includes('user') && rawMessage?.toLowerCase().includes('not found')) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.USER_NOT_FOUND,
            status,
            message: rawMessage || 'Usuario no encontrado',
            isTechnical: false
        };
    }

    if (isInvalidCredentials) {
        const rawLower = rawMessage?.toLowerCase() || '';
        if (rawLower.includes('pin') || rawLower.includes('credential') || rawLower.includes('invalid')) {
            return {
                code: AUTH_BACKEND_ERROR_CODES.INVALID_CREDENTIALS,
                status,
                message: 'PIN inválido',
                isTechnical: false
            };
        }
        return {
            code: AUTH_BACKEND_ERROR_CODES.INVALID_CREDENTIALS,
            status,
            message: rawMessage || 'Credenciales inválidas',
            isTechnical: false
        };
    }

    if (isServerError || backendCode === AUTH_BACKEND_ERROR_CODES.SERVER_ERROR) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.SERVER_ERROR,
            status,
            message: rawMessage || AUTH_MESSAGES.SERVER_ERROR,
            isTechnical: true
        };
    }

    return {
        code: AUTH_BACKEND_ERROR_CODES.SERVER_ERROR,
        status,
        message: rawMessage || AUTH_MESSAGES.UNEXPECTED_ERROR,
        isTechnical: true
    };
}

export function mapAuthErrorToType(
    status: number, 
    rawMessage: string | undefined,
    backendCode?: string | null
): AuthErrorType {
    const rawLower = rawMessage?.toLowerCase() || '';
    const isNetworkError = !status;

    const isServerError = status >= 500;
    const isInvalidCredentials = status === 401;
    const isDeviceLocked = status === 403;
    const isRateLimited = status === 429;

    if (isNetworkError) return AuthErrorType.CONNECTION_ERROR;
    if (isRateLimited) return AuthErrorType.RATE_LIMIT_EXCEEDED;
    
    // Códigos específicos del backend (patrón Result)
    // IMPORTANTE: Priorizar los códigos del backend antes de verificar status codes
    if (backendCode === AUTH_BACKEND_ERROR_CODES.DB_CONNECTION_ERROR || backendCode === 'DB_CONNECTION_ERROR') {
        return AuthErrorType.DB_CONNECTION_ERROR;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.DB_QUERY_ERROR || backendCode === 'DB_QUERY_ERROR') {
        return AuthErrorType.DB_QUERY_ERROR;
    }

    if (backendCode === AUTH_BACKEND_ERROR_CODES.INVALID_PIN || backendCode === 'INVALID_PIN') {
        return AuthErrorType.INVALID_PIN;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.USER_NOT_FOUND || backendCode === 'USER_NOT_FOUND') {
        return AuthErrorType.USER_NOT_FOUND;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.ACCOUNT_DISABLED || backendCode === 'ACCOUNT_DISABLED') {
        return AuthErrorType.ACCOUNT_DISABLED;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.ACCOUNT_LOCKED || backendCode === 'ACCOUNT_LOCKED') {
        return AuthErrorType.ACCOUNT_LOCKED;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.DEVICE_ID_REQUIRED || backendCode === 'DEVICE_ID_REQUIRED') {
        return AuthErrorType.DEVICE_ID_REQUIRED;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.DEVICE_LOCKED || backendCode === 'DEVICE_LOCKED' || isDeviceLocked) {
        return AuthErrorType.DEVICE_LOCKED;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.SESSION_EXPIRED || backendCode === 'SESSION_EXPIRED') {
        return AuthErrorType.SESSION_EXPIRED;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.INVALID_REQUEST || backendCode === 'INVALID_REQUEST') {
        return AuthErrorType.INVALID_REQUEST;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.INVALID_PIN_FORMAT || backendCode === 'INVALID_PIN_FORMAT') {
        return AuthErrorType.INVALID_PIN_FORMAT;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.CONFIRMATION_TOKEN_INVALID || backendCode === 'CONFIRMATION_TOKEN_INVALID') {
        return AuthErrorType.CONFIRMATION_TOKEN_INVALID;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.USERNAME_TAKEN || backendCode === 'USERNAME_TAKEN') {
        return AuthErrorType.USERNAME_TAKEN;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.EMAIL_TAKEN || backendCode === 'EMAIL_TAKEN') {
        return AuthErrorType.EMAIL_TAKEN;
    }
    
    if (backendCode === AUTH_BACKEND_ERROR_CODES.ENDPOINT_DEPRECATED || backendCode === 'ENDPOINT_DEPRECATED') {
        return AuthErrorType.ENDPOINT_DEPRECATED;
    }
    
    if (isServerError) return AuthErrorType.SERVER_ERROR;
    
    if (isInvalidCredentials) {
        if (rawLower.includes('pin') || rawLower.includes('credential') || rawLower.includes('invalid')) {
            return AuthErrorType.INVALID_CREDENTIALS;
        }
        return AuthErrorType.INVALID_CREDENTIALS;
    }

    return AuthErrorType.UNKNOWN_ERROR;
}

export function mapAuthBackendError(
    status: number, 
    rawMessage: string | undefined,
    backendCode?: string | null
): string {
    const mappedError = createAuthBackendError(status, rawMessage, backendCode);
    return mappedError.message;
}
