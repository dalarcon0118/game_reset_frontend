import settings from '../../config/settings';
import { TokenService } from './token_service'; // Use TokenService instead of direct SecureStore
import { logger } from '../utils/logger';

const log = logger.withTag('API_CLIENT');

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

export interface RequestOptions extends RequestInit {
  skipAuthHandler?: boolean;
  skipAuth?: boolean; // New flag to skip token validation and attachment
  silentErrors?: boolean; // New flag to suppress error logging for expected failures
  cacheTTL?: number; // In milliseconds
  retryCount?: number;
  abortSignal?: AbortSignal;
  timeoutProfile?: 'FAST' | 'NORMAL' | 'SLOW';
  queryParams?: Record<string, any>; // Optional query parameters
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
let onSessionExpired: (() => void) | null = null;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helpers ---

const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach(v => query.append(key, String(v)));
    } else {
      query.append(key, String(value));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
};

// --- API Client ---

const apiClient = {
  setErrorHandler(handler: ErrorHandler | null) {
    errorHandler = handler;
  },

  setSessionExpiredHandler(handler: () => void) {
    onSessionExpired = handler;
  },

  setupAuthErrorHandler(logoutCallback: () => Promise<void>) {
    this.setErrorHandler(async (error: ApiClientError, endpoint: string, options: RequestInit) => {
      if (error.status === 401 || error.status === 403) {
        log.info('Authentication failed, logging out user', { status: error.status, endpoint });
        try {
          await logoutCallback();
          return { retry: false };
        } catch (logoutError) {
          log.error('Logout callback failed', logoutError);
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

    const { refresh: refreshToken } = await TokenService.getToken();
    if (!refreshToken) {
      log.warn('No refresh token available, session expired.');
      if (onSessionExpired) onSessionExpired();
      return null;
    }

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
      if (onSessionExpired) {
        log.warn('Refresh token failed, session expired.');
        onSessionExpired();
      }
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
      skipAuthHandler,
      silentErrors,
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
        log.debug('Returning cached data', { endpoint });
        return cached.data as T;
      }
    }

    // Check if endpoint is whitelisted as public
    const isPublicEndpoint = settings.api.endpoints.public?.some((publicPath: string) => endpoint.includes(publicPath));
    const shouldSkipAuth = fetchOptions.skipAuth || isPublicEndpoint;

    // Check token expiration before request (only for authenticated endpoints)
    if (!shouldSkipAuth && !endpoint.includes(settings.api.endpoints.refresh())) {
      const token = await this.getAuthToken();
      if (token && this.isTokenExpired(token)) {
        log.debug('Token expired, refreshing...');
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
          log.debug(`Retrying request (attempt ${attempt}) after ${delay}ms`, { endpoint });
          await sleep(delay);
        }

        const currentToken = await this.getAuthToken();

        let fullUrl = `${settings.api.baseUrl}${endpoint}`;
        if (fetchOptions.queryParams) {
          const queryString = buildQueryString(fetchOptions.queryParams);
          if (queryString) {
            // Handle existing query params in endpoint
            fullUrl += fullUrl.includes('?') ? queryString.replace('?', '&') : queryString;
          }
        }

        // Log outgoing request
        let parsedBody: any = null;
        try {
          parsedBody = fetchOptions.body ? JSON.parse(fetchOptions.body as string) : null;
          // Mask sensitive fields in logs
          if (parsedBody && typeof parsedBody === 'object') {
            const sensitiveKeys = ['password', 'pin', 'token', 'access', 'refresh'];
            parsedBody = { ...parsedBody }; // Clone to avoid mutating original request
            Object.keys(parsedBody).forEach(key => {
              if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                parsedBody[key] = '********';
              }
            });
          }
        } catch (e) {
          parsedBody = fetchOptions.body; // Fallback to raw body if not JSON
        }

        log.debug(`>>> API REQUEST: ${fetchOptions.method || 'GET'} ${fullUrl}`, {
          payload: parsedBody,
          headers: fetchOptions.headers
        });

        const config: RequestInit = {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(!fetchOptions.skipAuth && currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
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
            // Log error response body
            log.error(`<<< API ERROR RESPONSE: ${response.status}`, {
              endpoint,
              status: response.status,
              data: errorData
            });
          } catch {
            errorData = { message: response.statusText || `Error ${response.status}` };
            log.error(`<<< API ERROR (Could not parse body): ${response.status}`, {
              endpoint,
              status: response.status
            });
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
              return this.request(endpoint, { ...options, skipAuthHandler: true }) as Promise<T>;
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
          log.debug(`<<< API SUCCESS RESPONSE: 204 (No Content) ${endpoint}`);
          return undefined as T;
        }
        let responseData = await response.json();
        consecutiveFailures = 0;

        // Log successful response
        log.debug(`<<< API SUCCESS RESPONSE: ${response.status} ${endpoint}`, {
          data: responseData
        });

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
    return this.request(endpoint, { ...options, method: 'GET' }) as Promise<T>;
  },

  post<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }) as Promise<T>;
  },

  put<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }) as Promise<T>;
  },

  delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'DELETE' }) as Promise<T>;
  },

  patch<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }) as Promise<T>;
  },

  async getAuthToken(): Promise<string | null> {
    if (currentAccessToken) return currentAccessToken;
    try {
      const { access } = await TokenService.getToken();
      if (access) currentAccessToken = access;
      return access;
    } catch (error) {
      logger.error('Error reading token from TokenService', 'API', error);
      return null;
    }
  },

  async setAuthToken(token: string | null, refreshToken: string | null = null) {
    currentAccessToken = token;
    try {
      if (token) {
        await TokenService.saveToken(token, refreshToken || undefined);
      } else {
        await TokenService.clearToken();
      }
    } catch (error) {
      logger.error('Error writing token to TokenService', 'API', error);
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

export { apiClient };
export default apiClient;
