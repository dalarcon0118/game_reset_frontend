import settings from '@/config/settings';
import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

const TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const LAST_USER_KEY = 'auth_last_username';

interface RequestOptions extends RequestInit {
  skipAuthHandler?: boolean;
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
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

// Error handler para que AuthContext maneje errores 401
type ErrorHandlerResponse = { retry: boolean; newToken?: string } | null;
type ErrorHandler = (error: ApiClientError, endpoint: string, options: RequestInit) => Promise<ErrorHandlerResponse>;

let errorHandler: ErrorHandler | null = null;

export const setErrorHandler = (handler: ErrorHandler | null) => {
  errorHandler = handler;
};

const getAuthToken = async (): Promise<string | null> => {
  // Preferimos el token en memoria por velocidad
  if (currentAccessToken) return currentAccessToken;

  // Como respaldo, leemos SecureStore
  try {
    const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (savedToken) {
      currentAccessToken = savedToken;
    }
    return savedToken;
  } catch (error) {
    logger.error('Error reading from SecureStore', 'API', error);
    return null;
  }
};

const apiClient = {
  async refreshAccessToken(): Promise<string | null> {
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh(resolve);
      });
    }

    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      logger.warn('No refresh token available', 'API');
      return null;
    }

    isRefreshing = true;
    try {
      logger.debug('Attempting token refresh...', 'API');
      const response = await fetch(`${settings.api.baseUrl}${settings.api.endpoints.refresh()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        let errorData: ApiClientErrorData = { detail: `Error ${response.status}` };
        try { errorData = await response.json(); } catch { }
        logger.error('Refresh token failed', 'API', errorData, { status: response.status });
        throw new ApiClientError(errorData.detail || 'Error en refresh token', response.status, errorData);
      }

      const data = await response.json();
      const newAccess = data?.access ?? null;
      const newRefresh = data?.refresh ?? null;

      if (newAccess) {
        logger.info('Token refreshed successfully', 'API');
        await apiClient.setAuthToken(newAccess, newRefresh);
        onTokenRefreshed(newAccess);
        return newAccess;
      } else {
        logger.warn('Refresh response did not contain new access token', 'API');
        await apiClient.setAuthToken(null, null);
        onTokenRefreshed('');
        return null;
      }
    } catch (error) {
      logger.error('Refresh error', 'API', error);
      currentAccessToken = null;
      onTokenRefreshed('');
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Fallo al refrescar token',
        0,
        { detail: error instanceof Error ? error.message : 'Error desconocido' }
      );
    } finally {
      isRefreshing = false;
    }
  },
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Si hay un refresh en curso, esperamos a que termine
    if (isRefreshing && !endpoint.includes(settings.api.endpoints.refresh())) {
      logger.debug('Refresh in progress, queuing request', 'API', { endpoint });
      return new Promise((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          const retryOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
            }
          };
          resolve(await this.request<T>(endpoint, retryOptions));
        });
      });
    }

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
      logger.debug(`Requesting: ${endpoint}`, 'API', { method: config.method || 'GET' });
      const response = await fetch(`${settings.api.baseUrl}${endpoint}`, config);

      // Check for new token in Authorization header and update if present
      const authHeader = response.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const newToken = authHeader.substring(7);
        if (newToken) {
          logger.debug('Updating token from response header', 'API');
          apiClient.setAuthToken(newToken);
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
          logger.error(`API Error ${response.status}`, 'API', errorData, { endpoint, method: config.method });
        } else {
          logger.debug('401 received, delegating to error handler', 'API', { endpoint });
        }

        // Call error handler for 401 errors
        if ((response.status === 401 || response.status === 403) && errorHandler && !options.skipAuthHandler) {
          const error = new ApiClientError(
            errorData.detail || `HTTP error! status: ${response.status}`,
            response.status,
            errorData
          );

          try {
            logger.debug(`Delegating ${response.status} to error handler`, 'API', { endpoint });
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
              logger.debug('Retrying request after handler response', 'API', { endpoint });
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
            logger.error('Error handler failed', 'API', handlerError);
            if (handlerError instanceof ApiClientError) throw handlerError;
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
        logger.debug('Response: 204 No Content', 'API', { endpoint });
        return undefined as T; // O lo que sea apropiado para una respuesta vacía
      }

      const responseData = await response.json() as T;
      logger.debug('Response Success', 'API', { endpoint, data: responseData });
      return responseData;
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        logger.error('Network Request Failed', 'API', error, { endpoint, method: config.method });
      }
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

  patch<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  },

  // Permite configurar el access token en memoria y persistirlo junto con el refresh token opcionalmente
  async setAuthToken(token: string | null, refreshToken: string | null = null) {
    currentAccessToken = token;
    try {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }

      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else if (token === null) {
        // Solo borramos el refresh token si estamos haciendo logout explícito (token null)
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error persisting tokens to SecureStore:', error);
    }
  },

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (e) {
      return true;
    }
  },

  async checkTokenValidity(): Promise<boolean> {
    const token = await getAuthToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  },

  async getAuthToken(): Promise<string | null> {
    return getAuthToken();
  },

  async clearAuthToken() {
    await this.setAuthToken(null);
  },

  async saveLastUsername(username: string) {
    try {
      await SecureStore.setItemAsync(LAST_USER_KEY, username);
    } catch (error) {
      console.error('Error saving username to SecureStore:', error);
    }
  },

  async getLastUsername(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(LAST_USER_KEY);
    } catch (error) {
      console.error('Error reading username from SecureStore:', error);
      return null;
    }
  }
};

export default apiClient;