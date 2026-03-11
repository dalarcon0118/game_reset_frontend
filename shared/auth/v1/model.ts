import { RemoteData } from '../../core/tea-utils/remote.data';

export enum AuthStatus {
    IDLE = 'IDLE',
    HYDRATING = 'HYDRATING',
    AUTHENTICATED = 'AUTHENTICATED',
    REFRESHING = 'REFRESHING',
    EXPIRED = 'EXPIRED',
    ANONYMOUS = 'ANONYMOUS',
    LOGGING_OUT = 'LOGGING_OUT',
}

export enum PersistStatus {
    IDLE = 'IDLE',
    SAVING = 'SAVING',
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
}

export interface Tokens {
    access: string;
    refresh: string;
}

export interface User {
    id: string;
    email: string;
    username: string;
}

export interface AuthModel {
    status: AuthStatus;
    persistStatus: PersistStatus;
    tokens: Tokens | null;
    user: User | null;
    error: string | null;
    lastRefreshAttempt: number | null;
}

export const initialModel: AuthModel = {
    status: AuthStatus.IDLE,
    persistStatus: PersistStatus.IDLE,
    tokens: null,
    user: null,
    error: null,
    lastRefreshAttempt: null,
};
