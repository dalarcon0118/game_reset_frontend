import { GlobalMsg, createMsg, MsgCreator } from '../../core/tea-utils';
import { User } from '../../repositories/auth/types/types';
import { Tokens } from './model';

export const HYDRATE_LOGIN_CONTEXT_REQUESTED = createMsg<'HYDRATE_LOGIN_CONTEXT_REQUESTED'>('HYDRATE_LOGIN_CONTEXT_REQUESTED');
export const INITIAL_SESSION_CHECK_REQUESTED = createMsg<'INITIAL_SESSION_CHECK_REQUESTED'>('INITIAL_SESSION_CHECK_REQUESTED');
export const SESSION_HYDRATED = createMsg<'SESSION_HYDRATED', { user: User | null; tokens: Tokens | null; isOffline: boolean }>('SESSION_HYDRATED');
export const SESSION_CHANGED = createMsg<'SESSION_CHANGED', { user: User | null; isOffline: boolean }>('SESSION_CHANGED');
export const LOGIN_REQUESTED = createMsg<'LOGIN_REQUESTED', { username: string; pin: string }>('LOGIN_REQUESTED');
export const LOGIN_SUCCEEDED = createMsg<'LOGIN_SUCCEEDED', { user: User; tokens: Tokens; isOffline: boolean }>('LOGIN_SUCCEEDED');
export const LOGIN_FAILED = createMsg<'LOGIN_FAILED', { error: string }>('LOGIN_FAILED');
export const LOGIN_USERNAME_UPDATED = createMsg<'LOGIN_USERNAME_UPDATED', { username: string }>('LOGIN_USERNAME_UPDATED');
export const LOGIN_PIN_UPDATED = createMsg<'LOGIN_PIN_UPDATED', { pin: string }>('LOGIN_PIN_UPDATED');
export const LOGOUT_REQUESTED = createMsg<'LOGOUT_REQUESTED'>('LOGOUT_REQUESTED');
export const LOGOUT_COMPLETED = createMsg<'LOGOUT_COMPLETED'>('LOGOUT_COMPLETED');
export const AUTH_ERROR_DETECTED = createMsg<'AUTH_ERROR_DETECTED', { status: number; endpoint: string }>('AUTH_ERROR_DETECTED');
export const REFRESH_STARTED = createMsg<'REFRESH_STARTED'>('REFRESH_STARTED');
export const REFRESH_SUCCEEDED = createMsg<'REFRESH_SUCCEEDED', { tokens: Tokens }>('REFRESH_SUCCEEDED');
export const REFRESH_FAILED = createMsg<'REFRESH_FAILED', { error: string }>('REFRESH_FAILED');
export const SESSION_EXPIRED = createMsg<'SESSION_EXPIRED', { reason?: string }>('SESSION_EXPIRED');
export const GLOBAL_SIGNAL_RECEIVED = createMsg<'GLOBAL_SIGNAL_RECEIVED', { payload: GlobalMsg }>('GLOBAL_SIGNAL_RECEIVED');

export type AuthMsg =
    | ReturnType<typeof HYDRATE_LOGIN_CONTEXT_REQUESTED>
    | ReturnType<typeof INITIAL_SESSION_CHECK_REQUESTED>
    | ReturnType<typeof SESSION_HYDRATED>
    | ReturnType<typeof SESSION_CHANGED>
    | ReturnType<typeof LOGIN_REQUESTED>
    | ReturnType<typeof LOGIN_SUCCEEDED>
    | ReturnType<typeof LOGIN_FAILED>
    | ReturnType<typeof LOGIN_USERNAME_UPDATED>
    | ReturnType<typeof LOGIN_PIN_UPDATED>
    | ReturnType<typeof LOGOUT_REQUESTED>
    | ReturnType<typeof LOGOUT_COMPLETED>
    | ReturnType<typeof AUTH_ERROR_DETECTED>
    | ReturnType<typeof REFRESH_STARTED>
    | ReturnType<typeof REFRESH_SUCCEEDED>
    | ReturnType<typeof REFRESH_FAILED>
    | ReturnType<typeof SESSION_EXPIRED>
    | ReturnType<typeof GLOBAL_SIGNAL_RECEIVED>;
