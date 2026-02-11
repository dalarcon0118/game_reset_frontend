import { User } from '@/data/mock_data';
import apiClient, { ApiClientError } from '@/shared/services/api_client';
import { AuthApi } from './api';

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
        console.warn('Failed to logout from server, clearing local session anyway.', e);
      }
      await apiClient.clearAuthToken();
    } catch (error) {
      console.error('Logout error', error);
      await apiClient.clearAuthToken();
    }
  };

  // Setup the auth error handler when the service is initialized
  apiClient.setupAuthErrorHandler(logout);

  const login = async (username: string, password: string): Promise<User | null> => {
    const validationMessage = validateCredentials(username, password);
    if (validationMessage) {
      console.error('Validation error:', validationMessage);
      throw new Error(validationMessage);
    }

    try {
      const data = await AuthApi.login(username, password);
      await apiClient.setAuthToken(data.access, data.refresh);
      return data.user;
    } catch (error) {
      console.error('Login API error in LoginService:', error);
      await apiClient.setAuthToken(null);
      if (error instanceof ApiClientError) {
        throw new Error(error.data?.detail || error.message || 'Error al iniciar sesión.');
      }
      throw error;
    }
  };

  const checkLoginStatus = async (): Promise<User | null> => {
    try {
      return await AuthApi.getMe();
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
        console.log('Session expired or not found (401/403)');
        await logout();
      } else {
        console.error('Check login status error:', error);
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
