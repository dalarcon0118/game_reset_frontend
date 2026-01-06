// Initial auth state
import { AuthModel } from './types';

export const initialAuthModel: AuthModel = {
    // Auth state
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isLoggingOut: false,
    error: null,

    // Login session
    loginSession: {
        username: '', // Se cargará de SecureStore al iniciar
        pin: '',
        isSubmitting: false,
    },
};
