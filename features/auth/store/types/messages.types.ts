// Auth message types - TEA messages for authentication
import { User } from './auth.types';
import { WebData } from '@/shared/core/remote.data';

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
    FORGOT_PIN_REQUESTED = 'FORGOT_PIN_REQUESTED',
}

export type AuthMsg =
    | { type: AuthMsgType.LOGIN_REQUESTED; username: string; pin: string }
    | { type: AuthMsgType.LOGIN_PIN_UPDATED; pin: string }
    | { type: AuthMsgType.LOGIN_USERNAME_UPDATED; username: string }
    | { type: AuthMsgType.LOGIN_RESPONSE_RECEIVED; webData: WebData<User | null> }
    | { type: AuthMsgType.LOGIN_SUCCEEDED; user: User }
    | { type: AuthMsgType.LOGIN_FAILED; error: string }
    | { type: AuthMsgType.LOGOUT_REQUESTED }
    | { type: AuthMsgType.LOGOUT_SUCCEEDED }
    | { type: AuthMsgType.LOGOUT_FAILED; error: string }
    | { type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED }
    | { type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED; webData: WebData<User | null> }
    | { type: AuthMsgType.CHECK_AUTH_STATUS_FAILED; error: string }
    | { type: AuthMsgType.SESSION_EXPIRED }
    | { type: AuthMsgType.ROLE_CHECK_REQUESTED; role: string }
    | { type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED }
    | { type: AuthMsgType.SAVED_USERNAME_LOADED; username: string | null }
    | { type: AuthMsgType.FORGOT_PIN_REQUESTED };
