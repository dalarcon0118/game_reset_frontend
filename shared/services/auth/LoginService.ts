import { User } from '@/data/mockData';
import settings from '@/config/settings';
import apiClient, { ApiClientError } from '../ApiClient'; // Importamos nuestro ApiClient

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

  const login = async (username: string, password: string): Promise<User | null> => {
    const validationMessage = validateCredentials(username, password);
    if (validationMessage) {
      console.error('Validation error:', validationMessage);
      throw new Error(validationMessage);
    }

    try {
      console.log('Login request:', { username, password });
      const data = await apiClient.post<LoginResponse>(settings.api.endpoints.login(), { username, password });
      console.log('Login response:', data);
      // Mantener el access token solo en memoria
      apiClient.setAuthToken(data.access);
      // Con cookies habilitadas, no persistimos el refresh token en el cliente

      return data.user;
    } catch (error) {
      console.error('Login API error in LoginService:', error);
      apiClient.setAuthToken(null);
      // El ApiClientError ya tiene un mensaje útil, o es un Error genérico
      if (error instanceof ApiClientError) {
        // Puedes personalizar más el mensaje si es necesario basado en error.status o error.data
        throw new Error(error.data.detail || error.message || 'Error al iniciar sesión.');
      }
      throw error; // Re-lanzamos el error para que el componente que llama pueda manejarlo
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Llamada al backend para eliminar la cookie de refresh
      try {
        await apiClient.post(settings.api.endpoints.logout(), {});
      } catch (e) {
        console.warn('Failed to logout from server, clearing local session anyway.', e);
      }
      apiClient.setAuthToken(null);
     
    } catch (error) {
      console.error('Logout error', error);
      apiClient.setAuthToken(null);
    }
  };

  const checkLoginStatus = async (): Promise<User | null> => {
    try {
      // Verificar sesión preguntando al backend; auto-refresh se encargará si el access expiró
      const me = await apiClient.get<User>(settings.api.endpoints.me());
      // Opcional: mantener copia local del usuario
     // await SecureStore.setItemAsync('loggedInUser', JSON.stringify(me));
      return me;
    } catch (error) {
      console.error('Check login status error:', error);
      await logout();
      return null;
    }
  };

  return {
    login,
    logout,
    checkLoginStatus,
  };
};