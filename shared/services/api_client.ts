import settings from '@/config/settings';
import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

const TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const LAST_USER_KEY = 'auth_last_username';

// --- Types ---

export interface ApiClientErrorData {
  error_type?: string;
  message?: string;
  context?: any;
  detail?: string;
  retry_after?: number; // For 429 errors
  [key: string]: any;
}

export class ApiClientError extends Error {
  status: number;
  data: ApiClientErrorData;
  errorType: string;

  constructor(message: string, status: number, data: ApiClientErrorData) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
    this.errorType = data.error_type || 'UnknownError';
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

interface RequestOptions extends RequestInit {
  skipAuthHandler?: boolean;
  silentErrors?: boolean; // New flag to suppress error logging for expected failures
  cacheTTL?: number; // In milliseconds
  retryCount?: number;
  abortSignal?: AbortSignal;
  timeoutProfile?: 'FAST' | 'NORMAL' | 'SLOW';
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// --- State ---

let currentAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
const apiCache = new Map<string, CacheEntry>();

// Alerting State
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 3;

// --- Helpers ---

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

type ErrorHandlerResponse = { retry: boolean; newToken?: string } | null;
type ErrorHandler = (error: ApiClientError, endpoint: string, options: RequestInit) => Promise<ErrorHandlerResponse>;

let errorHandler: ErrorHandler | null = null;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Client ---

const apiClient = {
  setErrorHandler(handler: ErrorHandler | null) {
    errorHandler = handler;
  },

  setupAuthErrorHandler(logoutCallback: () => Promise<void>) {
    this.setErrorHandler(async (error: ApiClientError, endpoint: string, options: RequestInit) => {
      if (error.status === 401 || error.status === 403) {
        logger.info('Authentication failed, logging out user', 'API', { status: error.status, endpoint });
        try {
          await logoutCallback();
          return { retry: false };
        } catch (logoutError) {
          logger.error('Logout callback failed', 'API', logoutError);
          return { retry: false };
        }
      }
      return { retry: false };
    });
  },

  async refreshAccessToken(): Promise<string | null> {
    if (isRefreshing) {
      return new Promise((resolve) => subscribeTokenRefresh(resolve));
    }

    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    isRefreshing = true;
    try {
      const response = await fetch(`${settings.api.baseUrl}${settings.api.endpoints.refresh()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        let errorData: ApiClientErrorData = { detail: `Error ${response.status}` };
        try { errorData = await response.json(); } catch { }
        throw new ApiClientError(errorData.message || 'Error en refresh token', response.status, errorData);
      }

      const data = await response.json();
      const newAccess = data?.access ?? null;
      const newRefresh = data?.refresh ?? null;

      if (newAccess) {
        await this.setAuthToken(newAccess, newRefresh);
        onTokenRefreshed(newAccess);
        return newAccess;
      } else {
        await this.setAuthToken(null, null);
        onTokenRefreshed('');
        return null;
      }
    } catch (error) {
      currentAccessToken = null;
      onTokenRefreshed('');
      throw error;
    } finally {
      isRefreshing = false;
    }
  },

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      cacheTTL = 0,
      retryCount = 0,
      abortSignal,
      timeoutProfile,
      ...fetchOptions
    } = options;

    const timeout = timeoutProfile
      ? settings.api.timeoutProfiles[timeoutProfile]
      : settings.api.timeout;

    const cacheKey = `${fetchOptions.method || 'GET'}:${endpoint}:${JSON.stringify(fetchOptions.body || '')}`;

    // ... (cache check remains same)
    if (fetchOptions.method === 'GET' || !fetchOptions.method) {
      const cached = apiCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        logger.debug('Returning cached data', 'API', { endpoint });
        return cached.data as T;
      }
    }

    // ... (token refresh remains same)
    if (!endpoint.includes(settings.api.endpoints.refresh())) {
      const token = await this.getAuthToken();
      if (token && this.isTokenExpired(token)) {
        logger.debug('Token expired, refreshing...', 'API');
        await this.refreshAccessToken();
      }
    }

    let lastError: any;
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.debug(`Retrying request (attempt ${attempt}) after ${delay}ms`, 'API', { endpoint });
          await sleep(delay);
        }

        const currentToken = await this.getAuthToken();
        const fullUrl = `${settings.api.baseUrl}${endpoint}`;

        const config: RequestInit = {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
            ...fetchOptions.headers,
          },
          signal: abortSignal || controller.signal,
          // Removed credentials: 'include' to avoid CORS issues with JWT on Android/iOS
        };

        const response = await fetch(fullUrl, config);
        clearTimeout(id);

        if (!response.ok) {
          // Only log error if not explicitly silenced
          if (!options.silentErrors) {
            logger.error(`API Error Response: ${response.status}`, 'API', {
              endpoint,
              status: response.status,
              statusText: response.statusText
            });
          }

          consecutiveFailures++;
          if (consecutiveFailures >= FAILURE_THRESHOLD) {
            logger.error(`CRITICAL: Multiple consecutive API failures (${consecutiveFailures})`, 'API', {
              endpoint,
              status: response.status,
              threshold: FAILURE_THRESHOLD
            });
          }
          let errorData: ApiClientErrorData = {};
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText || `Error ${response.status}` };
          }

          const error = new ApiClientError(
            errorData.message || `HTTP error! status: ${response.status}`,
            response.status,
            errorData
          );

          // Handle 401/403 with error handler
          if ((response.status === 401 || response.status === 403) && errorHandler && !options.skipAuthHandler) {
            const handlerRes = await errorHandler(error, endpoint, config);
            if (handlerRes?.retry) {
              // Recursive call for retry with new token
              return this.request<T>(endpoint, { ...options, skipAuthHandler: true });
            }
          }

          // Handle 429 Too Many Requests
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            logger.warn(`Rate limit exceeded for ${endpoint}. Retry after ${retryAfter}s`, 'API');
            if (retryAfter) {
              error.data.retry_after = parseInt(retryAfter, 10);
            }
          }

          // Retry on 5xx errors if retryCount > 0
          if (response.status >= 500 && attempt < retryCount) {
            lastError = error;
            continue;
          }

          throw error;
        }

        if (response.status === 204) {
          consecutiveFailures = 0;
          return undefined as T;
        }
        let responseData = await response.json();
        consecutiveFailures = 0;

        // Auto-extract results from paginated response
        if (responseData && typeof responseData === 'object' && 'results' in responseData && Array.isArray(responseData.results)) {
          logger.debug('Detected paginated response, extracting results', 'API', { endpoint });
          responseData = responseData.results;
        }

        const finalData = responseData as T;

        // 3. Update Cache if successful
        if ((fetchOptions.method === 'GET' || !fetchOptions.method) && cacheTTL > 0) {
          apiCache.set(cacheKey, {
            data: finalData,
            timestamp: Date.now(),
            ttl: cacheTTL
          });
        }

        return finalData;

      } catch (error) {
        clearTimeout(id);

        const fullUrl = `${settings.api.baseUrl}${endpoint}`;

        // Only log network/request errors if not silenced
        if (!options.silentErrors) {
          logger.error(`Network or Request Error: ${endpoint}`, 'API', {
            url: fullUrl,
            message: error instanceof Error ? error.message : 'Unknown error',
            error
          });
        }

        if (error instanceof ApiClientError) throw error;
        if (error instanceof Error && error.name === 'AbortError') {
          // If explicitly aborted by the user (via options.abortSignal), rethrow
          if (options.abortSignal?.aborted) {
            logger.debug('Request aborted by user', 'API', { endpoint });
            throw error;
          }
          // Otherwise it's a timeout (our internal controller aborted)
          logger.warn(`Request timed out (attempt ${attempt})`, 'API', { endpoint });
          lastError = error;
          if (attempt < retryCount) {
             continue;
          }
        }

        lastError = error;
        if (attempt === retryCount) {
          throw new ApiClientError(
            error instanceof Error ? error.message : 'Network error',
            0,
            { message: error instanceof Error ? error.message : 'Unknown error' }
          );
        }
      }
    }
    throw lastError;
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

  patch<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  },

  async getAuthToken(): Promise<string | null> {
    if (currentAccessToken) return currentAccessToken;
    try {
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (savedToken) currentAccessToken = savedToken;
      return savedToken;
    } catch (error) {
      logger.error('Error reading from SecureStore', 'API', error);
      return null;
    }
  },

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
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      logger.error('Error writing to SecureStore', 'API', error);
    }
  },

  async clearAuthToken() {
    await this.setAuthToken(null);
    apiCache.clear(); // Clear cache on logout
  },

  isTokenExpired(token: string): boolean {
    try {
      if (!token || !token.includes('.')) return true;

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Use global atob or fallback if needed
      const atobFunc = typeof atob !== 'undefined'
        ? atob
        : (typeof window !== 'undefined' && window.atob)
          ? window.atob.bind(window)
          : null;

      if (!atobFunc) {
        logger.warn('atob is not available, assuming token is expired for safety', 'API');
        return true;
      }

      const jsonPayload = decodeURIComponent(
        atobFunc(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      const now = Math.floor(Date.now() / 1000);
      // Refresh 60 seconds before actual expiration for more safety
      return payload.exp - now < 60;
    } catch (error) {
      logger.error('Error decoding token', 'API', error);
      return true;
    }
  }
};

export default apiClient;
