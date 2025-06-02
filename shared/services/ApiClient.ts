import * as SecureStore from 'expo-secure-store';
import settings from '@/config/settings';

interface RequestOptions extends RequestInit {
  // Podrías añadir aquí tipos específicos para tus opciones si es necesario
}

interface ApiClientErrorData {
  detail?: string;
  [key: string]: any; // Para otros posibles campos de error del backend
}

export class ApiClientError extends Error {
  status: number;
  data: ApiClientErrorData;

  constructor(message: string, status: number, data: ApiClientErrorData) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
    // Asegurar que el prototipo se establece correctamente para instancias de errores personalizados
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

const getAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('authToken');
};

const apiClient = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const authToken = await getAuthToken();
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authToken) {
      defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${settings.api.baseUrl}${endpoint}`, config);

      if (!response.ok) {
        let errorData: ApiClientErrorData = { detail: `Error ${response.status}` };
        try {
          errorData = await response.json();
        } catch (e) {
          // Si el cuerpo del error no es JSON, usamos el texto del status
          errorData = { detail: response.statusText || `Error ${response.status}` };
        }
        console.error('API Client Error:', response.status, errorData);
        throw new ApiClientError(
          errorData.detail || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      // Si la respuesta es 204 No Content, no intentamos parsear JSON
      if (response.status === 204) {
        return undefined as T; // O lo que sea apropiado para una respuesta vacía
      }

      return await response.json() as T;
    } catch (error) {
      console.error('API Request Failed:', error);
      if (error instanceof ApiClientError) {
        throw error; // Re-lanzar el error personalizado
      }
      // Para errores de red u otros errores no HTTP
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Error de red o solicitud fallida',
        0, // Podrías usar un código de status específico para errores de red si quieres
        { detail: error instanceof Error ? error.message : 'Error desconocido' }
      );
    }
  },

  get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  },

  put<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  },

  delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
  // Puedes añadir patch, etc., según necesites
};

export default apiClient;