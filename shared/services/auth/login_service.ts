import { User } from '@/data/mock_data';
import apiClient, { ApiClientError } from '@/shared/services/api_client';
import { AuthApi } from './api';
import { logger } from '../../utils/logger';

const log = logger.withTag('LOGIN_SERVICE');

export const LoginService = () => {
  const validateCredentials = (username: string, password: string): string | null => {
    if (!username.trim() || !password.trim()) {
      return 'Por favor ingrese usuario y contraseña';
    }
    return null;
  };

  const logout = async (): Promise<void> => {
    try {
      try {
        await AuthApi.logout();
      } catch (e) {
        log.warn('Failed to logout from server, clearing local session anyway', e);
      }
      await apiClient.clearAuthToken();
    } catch (error) {
      log.error('Logout error', error);
      await apiClient.clearAuthToken();
    }
  };

  // Setup the auth error handler when the service is initialized
  apiClient.setupAuthErrorHandler(logout);

  const login = async (username: string, password: string): Promise<User | null> => {
    const validationMessage = validateCredentials(username, password);
    if (validationMessage) {
      log.warn('Validation error during login', { message: validationMessage });
      throw new Error(validationMessage);
    }

    try {
      const data = await AuthApi.login(username, password);
      await apiClient.setAuthToken(data.access, data.refresh);
      return data.user;
    } catch (error) {
      log.error('Login API error', error);
      await apiClient.setAuthToken(null);
      if (error instanceof ApiClientError) {
        throw new Error(error.data?.detail || error.message || 'Error al iniciar sesión.');
      }
      throw error;
    }
  };

  const checkLoginStatus = async (): Promise<User | null> => {
    try {
      log.info('Checking online login status...');
      const user = await AuthApi.getMe();
      log.info('Online session valid', { username: user?.username });
      return user;
    } catch (error: any) {
      const errorMsg = error.message || '';
      
      // Si es un error de red, no cerramos sesión, permitimos que TEA maneje el modo offline
      if (errorMsg.toLowerCase().includes('network request failed') ||
          errorMsg.toLowerCase().includes('failed to fetch') ||
          errorMsg.toLowerCase().includes('timeout') ||
          errorMsg.toLowerCase().includes('aborted')) {
        log.info('Server unreachable during check status, keeping current session state');
        throw error; // Propagamos para que update.ts lo capture como error de red
      }

      if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
        log.info('Session expired or not found (401/403), clearing session');
        await logout();
      } else {
        log.error('Check login status error', error);
      }
      return null;
    }
  };

  return {
    login,
    logout,
    checkLoginStatus,
  };
};
