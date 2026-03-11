import { Tokens, User } from './model';

export type AuthMsg =
    | { type: 'BOOTSTRAP_STARTED' }
    | { type: 'TOKENS_HYDRATED'; tokens: Tokens | null }
    | { type: 'LOGIN_REQUESTED'; credentials: any }
    | { type: 'LOGIN_SUCCEEDED'; tokens: Tokens; user: User }
    | { type: 'LOGIN_FAILED'; error: string }
    | { type: 'REFRESH_REQUESTED' }
    | { type: 'REFRESH_SUCCEEDED'; tokens: Tokens }
    | { type: 'REFRESH_FAILED'; error: string }
    | { type: 'LOGOUT_REQUESTED' }
    | { type: 'LOGOUT_COMPLETED' }
    | { type: 'AUTH_ERROR_DETECTED'; status: number; endpoint: string }
    | { type: 'SESSION_EXPIRED' }
    | { type: 'PERSIST_TOKENS_COMPLETED' }
    | { type: 'PERSIST_TOKENS_FAILED'; error: any }
    | { type: 'CLEAR_TOKENS_COMPLETED' };
