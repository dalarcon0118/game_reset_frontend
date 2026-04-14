import { AuthErrorType } from './types/types';
import { AUTH_MESSAGES } from './auth.messages';
import { AUTH_LOGS } from './auth.constants';

export const AUTH_BACKEND_ERROR_CODES = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    DEVICE_LOCKED: 'DEVICE_LOCKED',
    DEVICE_ID_REQUIRED: 'DEVICE_ID_REQUIRED', // Nuevo: device_id faltante
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type AuthBackendErrorCode = (typeof AUTH_BACKEND_ERROR_CODES)[keyof typeof AUTH_BACKEND_ERROR_CODES];

export interface AuthBackendError {
    code: AuthBackendErrorCode;
    status: number;
    message: string;
    isTechnical: boolean;
}

export function createAuthBackendError(status: number, rawMessage: string | undefined): AuthBackendError {
    const isNetworkError =
        status === 0 ||
        rawMessage?.toLowerCase().includes('network') ||
        rawMessage?.toLowerCase().includes('timeout') ||
        rawMessage?.toLowerCase().includes('abort');

    const isServerError = status >= 500;
    const isInvalidCredentials = status === 401;
    const isDeviceLocked = status === 403;
    const isSessionExpired = status === 401;
    const isAccountLocked = status === 423;

    if (isNetworkError) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.NETWORK_ERROR,
            status,
            message: AUTH_MESSAGES.UNEXPECTED_ERROR,
            isTechnical: false
        };
    }

    if (isAccountLocked) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.ACCOUNT_LOCKED,
            status,
            message: rawMessage || 'Cuenta bloqueada',
            isTechnical: false
        };
    }

    if (isDeviceLocked) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.DEVICE_LOCKED,
            status,
            message: rawMessage || AUTH_MESSAGES.UNEXPECTED_ERROR,
            isTechnical: false
        };
    }

    if (isSessionExpired || isInvalidCredentials) {
        const rawLower = rawMessage?.toLowerCase() || '';
        if (rawLower.includes('pin') || rawLower.includes('credential')) {
            return {
                code: AUTH_BACKEND_ERROR_CODES.INVALID_CREDENTIALS,
                status,
                message: 'PIN inválido',
                isTechnical: false
            };
        }
        if (rawLower.includes('session') || rawLower.includes('expired')) {
            return {
                code: AUTH_BACKEND_ERROR_CODES.SESSION_EXPIRED,
                status,
                message: 'Sesión expirada',
                isTechnical: false
            };
        }
        return {
            code: AUTH_BACKEND_ERROR_CODES.INVALID_CREDENTIALS,
            status,
            message: 'Credenciales inválidas',
            isTechnical: false
        };
    }

    if (isServerError) {
        return {
            code: AUTH_BACKEND_ERROR_CODES.SERVER_ERROR,
            status,
            message: AUTH_MESSAGES.UNEXPECTED_ERROR,
            isTechnical: true
        };
    }

    return {
        code: AUTH_BACKEND_ERROR_CODES.SERVER_ERROR,
        status,
        message: AUTH_MESSAGES.UNEXPECTED_ERROR,
        isTechnical: true
    };
}

export function mapAuthErrorToType(status: number, rawMessage: string | undefined): AuthErrorType {
    const rawLower = rawMessage?.toLowerCase() || '';
    const isNetworkError =
        status === 0 ||
        rawLower.includes('network') ||
        rawLower.includes('timeout') ||
        rawLower.includes('abort') ||
        !status;

    const isServerError = status >= 500;
    const isInvalidCredentials = status === 401;
    const isDeviceLocked = status === 403;
    
    // Detectar DEVICE_ID_REQUIRED (401 con código específico del backend)
    const isDeviceIdRequired = rawLower.includes('device_id_required') || rawMessage?.includes('DEVICE_ID_REQUIRED');

    if (isNetworkError) return AuthErrorType.CONNECTION_ERROR;
    if (isServerError) return AuthErrorType.SERVER_ERROR;
    
    // DEVICE_ID_REQUIRED: No es DEVICE_LOCKED, es un error de transporte/red
    // El frontend debe mostrar error de conexión, no de dispositivo bloqueado
    if (isDeviceIdRequired) return AuthErrorType.DEVICE_ID_REQUIRED;
    
    if (isInvalidCredentials) {
        if (rawLower.includes('pin') || rawLower.includes('credential') || rawLower.includes('invalid')) {
            return AuthErrorType.INVALID_CREDENTIALS;
        }
        return AuthErrorType.INVALID_CREDENTIALS;
    }
    if (isDeviceLocked) return AuthErrorType.DEVICE_LOCKED;

    return AuthErrorType.UNKNOWN_ERROR;
}

export function mapAuthBackendError(status: number, rawMessage: string | undefined): string {
    const mappedError = createAuthBackendError(status, rawMessage);
    return mappedError.message;
}
