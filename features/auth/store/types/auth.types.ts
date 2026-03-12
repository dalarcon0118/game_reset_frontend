// Auth state types - core authentication model
export { User } from '../../../../shared/repositories/auth';
import { WebData } from '@core/tea-utils';

/**
 * Single Source of Truth for Session Status.
 * Follows a formal state machine pattern.
 */
export type SessionStatus =
    | 'IDLE'           // Initial state before hydration
    | 'HYDRATING'      // Loading session from storage
    | 'ANONYMOUS'      // No session found
    | 'AUTHENTICATED'  // Session is valid and active
    | 'REFRESHING'     // Token expired, attempting background refresh
    | 'EXPIRED'        // Session expired and cannot be refreshed
    | 'LOGGING_OUT';   // Cleanup in progress

export interface AuthState {
    user: User | null;
    status: SessionStatus;
    loginResponse: WebData<User>;
    error: string | null;
}

export interface LoginSession {
    username: string;
    pin: string;
    isSubmitting: boolean;
}

// Main Auth Model
export interface AuthModel extends AuthState {
    loginSession: LoginSession;
}
