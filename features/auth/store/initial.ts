import { AuthModel } from './types';
import { RemoteData } from '../../../shared/core/remote.data';

export const initialAuthModel: AuthModel = {
    // Auth state
    user: null,
    isAuthenticated: false,
    loginResponse: RemoteData.notAsked(),
    isLoggingOut: false,
    error: null,

    // Login session
    loginSession: {
        username: '', // Se cargará de SecureStore al iniciar
        pin: '',
        isSubmitting: false,
    },
};
