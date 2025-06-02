import * as SecureStore from 'expo-secure-store';
import { User } from '@/data/mockData';
import settings from '@/config/settings';
import apiClient, { ApiClientError } from './ApiClient'; // Importamos nuestro ApiClient

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
      const data = await apiClient.post<LoginResponse>(settings.api.endpoints.login, { username, password });

      await SecureStore.setItemAsync('authToken', data.access);
      if (data.refresh) {
        await SecureStore.setItemAsync('refreshToken', data.refresh);
      }
      await SecureStore.setItemAsync('loggedInUser', JSON.stringify(data.user));

      return data.user;
    } catch (error) {
      console.error('Login API error in LoginService:', error);
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('loggedInUser');
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
      // Opcional: Llamada al backend para invalidar el token
      // try {
      //   await apiClient.post(`${settings.api.endpoints.auth}/logout/`, {}); // Ajusta el endpoint si es necesario
      // } catch (e) {
      //   console.warn('Failed to logout from server, clearing local session anyway.', e);
      // }

      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('loggedInUser');
    } catch (error) {
      console.error('Logout error', error);
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('loggedInUser');
    }
  };

  const checkLoginStatus = async (): Promise<User | null> => {
    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      const storedUserString = await SecureStore.getItemAsync('loggedInUser');

      if (!authToken || !storedUserString) {
        await logout();
        return null;
      }
      
      // TODO: Considerar verificar el token con el backend aquí usando apiClient
      // Ejemplo: try { await apiClient.get('/auth/me/'); } catch (e) { if (e.status === 401) { await logout(); return null; }} 

      const loggedInUser: User = JSON.parse(storedUserString);
      return loggedInUser;
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