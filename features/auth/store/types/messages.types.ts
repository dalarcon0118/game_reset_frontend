import { AuthSession, User, AuthErrorType } from '../../../../shared/repositories/auth';
import { WebData } from '@core/tea-utils';

export enum AuthMsgType {
    // Login flow
    LOGIN_REQUESTED = 'LOGIN_REQUESTED',
    LOGIN_PIN_UPDATED = 'LOGIN_PIN_UPDATED',
    LOGIN_USERNAME_UPDATED = 'LOGIN_USERNAME_UPDATED',
    LOGIN_RESPONSE_RECEIVED = 'LOGIN_RESPONSE_RECEIVED',
    LOGIN_SUCCEEDED = 'LOGIN_SUCCEEDED',
    LOGIN_FAILED = 'LOGIN_FAILED',

    // Logout
    LOGOUT_REQUESTED = 'LOGOUT_REQUESTED',
    LOGOUT_RESPONSE_RECEIVED = 'LOGOUT_RESPONSE_RECEIVED',
    LOGOUT_SUCCEEDED = 'LOGOUT_SUCCEEDED',
    LOGOUT_FAILED = 'LOGOUT_FAILED',

    // Session and Global Errors
    CHECK_AUTH_STATUS_REQUESTED = 'CHECK_AUTH_STATUS_REQUESTED',
    CHECK_AUTH_STATUS_RESPONSE_RECEIVED = 'CHECK_AUTH_STATUS_RESPONSE_RECEIVED',
    CHECK_AUTH_STATUS_FAILED = 'CHECK_AUTH_STATUS_FAILED',
    SESSION_EXPIRED = 'SESSION_EXPIRED',

    // Role checking
    ROLE_CHECK_REQUESTED = 'ROLE_CHECK_REQUESTED',

    // Persistence
    LOAD_SAVED_USERNAME_REQUESTED = 'LOAD_SAVED_USERNAME_REQUESTED',
    SAVED_USERNAME_LOADED = 'SAVED_USERNAME_LOADED',
    SAVED_USERNAME_SAVED = 'SAVED_USERNAME_SAVED',
    FORGOT_PIN_REQUESTED = 'FORGOT_PIN_REQUESTED',

    // Connectivity and Sync
    CONNECTION_STATUS_CHANGED = 'CONNECTION_STATUS_CHANGED',
    USER_CHANGED = 'USER_CHANGED',

    // New Signal-based Messages (Coordinator)
    SESSION_HYDRATED = 'SESSION_HYDRATED',
    TOKEN_REFRESH_STARTED = 'TOKEN_REFRESH_STARTED',
    TOKEN_REFRESHED = 'TOKEN_REFRESHED',
}

export type AuthMsg =
    | { type: AuthMsgType.LOGIN_REQUESTED; username: string; pin: string }
    | { type: AuthMsgType.LOGIN_PIN_UPDATED; pin: string }
    | { type: AuthMsgType.LOGIN_USERNAME_UPDATED; username: string }
    | { type: AuthMsgType.LOGIN_RESPONSE_RECEIVED; webData: WebData<AuthSession> }
    | { type: AuthMsgType.LOGIN_SUCCEEDED; user: User }
    | { type: AuthMsgType.LOGIN_FAILED; errorType: AuthErrorType; message: string }
    | { type: AuthMsgType.LOGOUT_REQUESTED }
    | { type: AuthMsgType.LOGOUT_RESPONSE_RECEIVED; webData: WebData<void> }
    | { type: AuthMsgType.LOGOUT_SUCCEEDED }
    | { type: AuthMsgType.LOGOUT_FAILED; error: string }
    | { type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED }
    | { type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED; webData: WebData<User | null> }
    | { type: AuthMsgType.CHECK_AUTH_STATUS_FAILED; error: string }
    | { type: AuthMsgType.SESSION_EXPIRED; reason?: string }
    | { type: AuthMsgType.ROLE_CHECK_REQUESTED }
    | { type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED }
    | { type: AuthMsgType.SAVED_USERNAME_LOADED; webData: WebData<string | null> }
    | { type: AuthMsgType.SAVED_USERNAME_SAVED; webData: WebData<void> }
    | { type: AuthMsgType.FORGOT_PIN_REQUESTED }
    | { type: AuthMsgType.CONNECTION_STATUS_CHANGED; isOnline: boolean }
    | { type: AuthMsgType.USER_CHANGED; user: User | null }
    | { type: AuthMsgType.SESSION_HYDRATED; user: User | null; tokenState: string }
    | { type: AuthMsgType.TOKEN_REFRESH_STARTED }
    | { type: AuthMsgType.TOKEN_REFRESHED; token: string };
