// Auth state types - core authentication model
import { UserRole } from '../../../../data/mockData';

export interface User {
    id: number | string;
    username: string;
    role: UserRole;
    name?: string;
    email?: string;
    structure?: {
        id: number | string;
        name?: string;
        commission_rate?: number;
    };
    // Add other user properties as needed
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
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
