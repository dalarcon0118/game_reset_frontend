/**
 * Definiciones de dominio para el sistema de gestión de sesiones.
 * Estos tipos representan el lenguaje canónico de la autenticación en la app.
 */

/**
 * Estado canónico de la sesión en el Store (SSOT).
 */
export type SessionStatus = 
    | 'IDLE'           // Estado inicial antes de hidratación
    | 'HYDRATING'      // Cargando sesión desde storage
    | 'ANONYMOUS'      // Sin sesión activa
    | 'AUTHENTICATED'  // Sesión válida y activa
    | 'REFRESHING'     // Token expirado, intentando refresh en segundo plano
    | 'EXPIRED'        // Sesión expirada y no recuperable sin login manual
    | 'LOGGING_OUT';   // Limpieza en progreso

/**
 * Estado técnico de la credencial (Token).
 */
export enum TokenState {
    ABSENT = 'ABSENT',                 // No hay token
    VALID = 'VALID',                   // Token presente y no expirado
    EXPIRED = 'EXPIRED',               // Token JWT expirado
    INVALID = 'INVALID',               // Token malformado o corrupto
    OFFLINE_MARKER = 'OFFLINE_MARKER'  // Marcador de sesión offline (no para enviar al servidor)
}

/**
 * Modo de operación de la credencial.
 */
export type CredentialMode = 'ONLINE' | 'OFFLINE';

/**
 * Contexto de decisión para la política de sesión.
 */
export interface SessionPolicyContext {
    status: SessionStatus;
    tokenState: TokenState;
    networkConnected: boolean;
    endpoint?: string;
    isPublicEndpoint?: boolean;
}

/**
 * Eventos de señalización de sesión (Signal Bus).
 */
export enum SessionSignalType {
    SESSION_HYDRATED = 'SESSION_HYDRATED',
    TOKEN_REFRESHED = 'TOKEN_REFRESHED',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    AUTH_ERROR_DETECTED = 'AUTH_ERROR_DETECTED',
    NETWORK_STATUS_CHANGED = 'NETWORK_STATUS_CHANGED'
}

export interface SessionSignal {
    type: SessionSignalType;
    payload?: any;
}
