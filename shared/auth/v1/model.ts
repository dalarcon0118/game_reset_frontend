import { User } from '../../repositories/auth/types/types';

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
}

export interface LoginSession {
    username: string;
    pin: string;
}

export interface AuthModel {
    status: AuthStatus;
    user: User | null;
    tokens: Tokens | null;
    error: string | null;
    isOffline: boolean;
    loginSession: LoginSession;
}

export const initialModel: AuthModel = {
    status: AuthStatus.IDLE,
    user: null,
    tokens: null,
    error: null,
    isOffline: false,
    loginSession: {
        username: '',
        pin: '',
    },
};
