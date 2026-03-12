import { AuthModel } from './types';
import { RemoteData } from '@core/tea-utils';

export const initialAuthModel: AuthModel = {
    // Auth state
    user: null,
    status: 'IDLE',
    loginResponse: RemoteData.notAsked(),
    error: null,

    // Login session
    loginSession: {
        username: '', // Se cargará de SecureStore al iniciar
        pin: '',
        isSubmitting: false,
    },
};
