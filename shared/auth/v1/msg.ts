import { User } from '../../repositories/auth/types/types';
import { Tokens } from './model';

export type AuthMsg =
    | { type: 'BOOTSTRAP_STARTED' }
    | { type: 'SESSION_HYDRATED'; user: User | null; tokens: Tokens | null; isOffline: boolean }
    | { type: 'SESSION_CHANGED'; user: User | null; isOffline: boolean }
    | { type: 'LOGIN_REQUESTED'; username: string; pin: string }
    | { type: 'LOGIN_SUCCEEDED'; user: User; tokens: Tokens; isOffline: boolean }
    | { type: 'LOGIN_FAILED'; error: string }
    | { type: 'LOGIN_USERNAME_UPDATED'; username: string }
    | { type: 'LOGIN_PIN_UPDATED'; pin: string }
    | { type: 'LOGOUT_REQUESTED' }
    | { type: 'LOGOUT_COMPLETED' }
    | { type: 'AUTH_ERROR_DETECTED'; status: number; endpoint: string }
    | { type: 'REFRESH_STARTED' }
    | { type: 'REFRESH_SUCCEEDED'; tokens: Tokens }
    | { type: 'REFRESH_FAILED'; error: string }
    | { type: 'SESSION_EXPIRED'; reason?: string };
