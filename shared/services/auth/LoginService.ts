import { User } from '@/data/mockData';
import settings from '@/config/settings';
import apiClient, { ApiClientError } from '@/shared/services/ApiClient'; // Importamos nuestro ApiClient

interface LoginResponse {
  access: string;
  refresh?: string;
  user: User;
}

export const LoginService = () => {
  const validateCredentials = (username: string, password: string): string | null => {
    if (!username.trim() || !password.trim()) {
      return 'Por favor ingrese usuario y contraseña';
    }
    return null;
  };

  const logout = async (): Promise<void> => {
    try {
      // Llamada al backend para eliminar la cookie de refresh
      try {
        await apiClient.post(settings.api.endpoints.logout(), {}, { skipAuthHandler: true });
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
      const data = await apiClient.post<LoginResponse>(settings.api.endpoints.login(), { username, password });
      // Persistir tanto el access token como el refresh token de forma segura
      await apiClient.setAuthToken(data.access, data.refresh);

      return data.user;
    } catch (error) {
      console.error('Login API error in LoginService:', error);
      await apiClient.setAuthToken(null);
      // El ApiClientError ya tiene un mensaje útil, o es un Error genérico
      if (error instanceof ApiClientError) {
        // Puedes personalizar más el mensaje si es necesario basado en error.status o error.data
        throw new Error(error.data.detail || error.message || 'Error al iniciar sesión.');
      }
      throw error; // Re-lanzamos el error para que el componente que llama pueda manejarlo
    }
  };


  const checkLoginStatus = async (): Promise<User | null> => {
    try {
      const me = await apiClient.get<User>(settings.api.endpoints.me());
      return me;
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
