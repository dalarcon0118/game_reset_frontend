import { User } from '../../repositories/auth/types/types';
import { isValidUser } from '../../repositories/auth/types/types';

export interface Tokens {
    access: string;
    refresh?: string;
}

export enum AuthStatus {
    IDLE = 'IDLE',
    BOOTSTRAPPING = 'BOOTSTRAPPING',
    AUTHENTICATING = 'AUTHENTICATING',
    AUTHENTICATED = 'AUTHENTICATED',
    AUTHENTICATED_OFFLINE = 'AUTHENTICATED_OFFLINE',
    UNAUTHENTICATED = 'UNAUTHENTICATED',
    REFRESHING = 'REFRESHING',
    EXPIRED = 'EXPIRED',
    LOGGING_OUT = 'LOGGING_OUT',
    DEVICE_LOCKED = 'DEVICE_LOCKED',
    CONNECTION_ERROR = 'CONNECTION_ERROR',
}

export interface AuthModel {
    status: AuthStatus;
    user: User | null;
    tokens: Tokens | null;
    error: string | null;
    isOffline: boolean;
    needs_pin_change: boolean;
}

// INICIAL: BOOTSTRAPPING en lugar de IDLE
// Esto asegura que useAuthNavigation espere a que hidratacion termine
export const initialModel: AuthModel = {
    status: AuthStatus.BOOTSTRAPPING,
    user: null,
    tokens: null,
    error: null,
    isOffline: false,
    needs_pin_change: false,
};

/**
 * Una sesión está hidratada si el usuario es válido
 * y ya no estamos en fase de bootstrap inicial.
 * IDLE es un estado hidratado (usuario restaurado, requiere PIN).
 */
export function isSessionHydrated(model: AuthModel): boolean {
    return isValidUser(model.user) && model.status !== AuthStatus.BOOTSTRAPPING;
}

/**
 * Usuario completamente autenticado (PIN confirmado).
 * IDLE NO cuenta como autenticado pleno.
 */
export function isFullyAuthenticated(model: AuthModel): boolean {
    return isValidUser(model.user) && (
        model.status === AuthStatus.AUTHENTICATED ||
        model.status === AuthStatus.AUTHENTICATED_OFFLINE ||
        model.status === AuthStatus.REFRESHING
    );
}
