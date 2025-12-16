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

// Token en memoria para evitar persistir el access token en el cliente
let currentAccessToken: string | null = null;

// Error handler para que AuthContext maneje errores 401
type ErrorHandlerResponse = { retry: boolean; newToken?: string } | null;
type ErrorHandler = (error: ApiClientError, endpoint: string, options: RequestInit) => Promise<ErrorHandlerResponse>;

let errorHandler: ErrorHandler | null = null;

export const setErrorHandler = (handler: ErrorHandler | null) => {
  errorHandler = handler;
};

const getAuthToken = async (): Promise<string | null> => {
  // Preferimos el token en memoria; como respaldo, leemos SecureStore si existe
  return currentAccessToken;
};

const apiClient = {
  async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await fetch(`${settings.api.baseUrl}${settings.api.endpoints.refresh()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        let errorData: ApiClientErrorData = { detail: `Error ${response.status}` };
        try { errorData = await response.json(); } catch { }
        throw new ApiClientError(errorData.detail || 'Error en refresh token', response.status, errorData);
      }
      const data = await response.json();
      const newAccess = data?.access ?? null;
      if (newAccess) {
        currentAccessToken = newAccess;
      } else {
        currentAccessToken = null;
      }
      return currentAccessToken;
    } catch (error) {
      currentAccessToken = null;
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Fallo al refrescar token',
        0,
        { detail: error instanceof Error ? error.message : 'Error desconocido' }
      );
    }
  },
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
      // Envío de cookies (e.g., refresh token HttpOnly) cuando corresponda
      credentials: 'include',
    };

    try {
      console.log('Making API Request:', `${settings.api.baseUrl}${endpoint}`, config);
      const response = await fetch(`${settings.api.baseUrl}${endpoint}`, config);

      // Check for new token in Authorization header and update if present
      const authHeader = response.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const newToken = authHeader.substring(7);
        if (newToken) {
          console.log('Updating token from response header');
          currentAccessToken = newToken;
        }
      }

      if (!response.ok) {
        let errorData: ApiClientErrorData = { detail: `Error ${response.status}` };
        try {
          errorData = await response.json();
        } catch (e) {
          // Si el cuerpo del error no es JSON, usamos el texto del status
          errorData = { detail: response.statusText || `Error ${response.status}` };
        }
        
        if (response.status !== 401 || !errorHandler) {
          console.error('API Client Error:', response.status, errorData);
        } else {
          console.log('API Client: 401 received, delegating to error handler');
        }

        // Call error handler for 401 errors
        if (response.status === 401 && errorHandler) {
          const error = new ApiClientError(
            errorData.detail || `HTTP error! status: ${response.status}`,
            response.status,
            errorData
          );

          try {
            const handlerResponse = await errorHandler(error, endpoint, config);
            if (handlerResponse?.retry) {
              // Retry the request with potentially new token
              const retryConfig: RequestInit = {
                ...config,
                headers: {
                  ...config.headers as HeadersInit,
                  ...(handlerResponse.newToken ? { Authorization: `Bearer ${handlerResponse.newToken}` } : {}),
                },
              };
              const retryResp = await fetch(`${settings.api.baseUrl}${endpoint}`, retryConfig);
              if (retryResp.ok) {
                if (retryResp.status === 204) return undefined as T;
                return await retryResp.json() as T;
              }
              // If retry fails, throw the retry error
              let retryErr: ApiClientErrorData = { detail: `Error ${retryResp.status}` };
              try { retryErr = await retryResp.json(); } catch { }
              throw new ApiClientError(retryErr.detail || `HTTP error! status: ${retryResp.status}`, retryResp.status, retryErr);
            }
          } catch (handlerError) {
            // If error handler itself fails, continue to throw original error
            console.error('Error handler failed:', handlerError);
          }
        }

        throw new ApiClientError(
          errorData.detail || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      // Si la respuesta es 204 No Content, no intentamos parsear JSON
      if (response.status === 204) {
        console.log('API Response: 204 No Content');
        return undefined as T; // O lo que sea apropiado para una respuesta vacía
      }

      const responseData = await response.json() as T;
      console.log('API Response Data:', responseData);
      return responseData;
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
    console.log('POST Request:', endpoint, body, options);
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  },

  put<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  },

  delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  // Permite configurar el access token en memoria y limpiarlo en logout
  setAuthToken(token: string | null) {
    currentAccessToken = token;
  },
  // Puedes añadir patch, etc., según necesites
};

export default apiClient;