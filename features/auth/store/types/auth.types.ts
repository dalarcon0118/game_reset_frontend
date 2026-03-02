// Auth state types - core authentication model
import { User } from '../../../../shared/repositories/auth';
import { WebData, RemoteData } from '../../../../shared/core/remote.data';

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loginResponse: WebData<User>; // RemoteData for the login result
    isLoggingOut: boolean;
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
