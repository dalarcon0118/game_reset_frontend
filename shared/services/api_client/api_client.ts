
import {
  RequestOptions,
  CacheEntry,
  ErrorHandler,
  IAuthRepository,
  ITimerRepository,
  ILogger,
  ISettings
} from './api_client.types';
import { ApiClientError, ApiClientErrorData } from './api_client.errors';

// --- API Client Class ---

export class ApiClient {
  private currentAccessToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private apiCache = new Map<string, CacheEntry>();
  private consecutiveFailures = 0;
  private readonly FAILURE_THRESHOLD = 3;

  private errorHandler: ErrorHandler | null = null;
  private onSessionExpired: (() => void) | null = null;

  constructor(
    private authRepo: IAuthRepository,
    private timerRepo: ITimerRepository,
    private settings: ISettings,
    private log: ILogger
  ) { }

  // --- Public Handlers ---

  setErrorHandler(handler: ErrorHandler | null) {
    this.errorHandler = handler;
  }

  setSessionExpiredHandler(handler: () => void) {
    this.onSessionExpired = handler;
  }

  setupAuthErrorHandler(logoutCallback: () => Promise<void>) {
    this.setErrorHandler(async (error: ApiClientError, endpoint: string) => {
      if (error.status === 401 || error.status === 403) {
        this.log.info('Authentication failed, logging out user', { status: error.status, endpoint });
        try {
          await logoutCallback();
          return { retry: false };
        } catch (logoutError) {
          this.log.error('Logout callback failed', logoutError);
          return { retry: false };
        }
      }
      return { retry: false };
    });
  }

  // --- Core Methods ---

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
      ? this.settings.api.timeoutProfiles[timeoutProfile]
      : this.settings.api.timeout;

    const cacheKey = `${fetchOptions.method || 'GET'}:${endpoint}:${JSON.stringify(fetchOptions.body || '')}`;

    // Cache check
    if (fetchOptions.method === 'GET' || !fetchOptions.method) {
      const cached = this.apiCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        this.log.debug('Returning cached data', { endpoint });
        return cached.data as T;
      }
    }

    // Check if endpoint is whitelisted as public
    const isPublicEndpoint = this.settings.api.endpoints.public?.some((publicPath: string) => endpoint.includes(publicPath));
    const shouldSkipAuth = fetchOptions.skipAuth || isPublicEndpoint;

    // Check token expiration before request
    if (!shouldSkipAuth && !endpoint.includes(this.settings.api.endpoints.refresh())) {
      const token = await this.getAuthToken();
      if (token && this.isTokenExpired(token)) {
        this.log.debug('Token expired, refreshing...');
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
          this.log.debug(`Retrying request (attempt ${attempt}) after ${delay}ms`, { endpoint });
          await this.sleep(delay);
        }

        const currentToken = await this.getAuthToken();

        let fullUrl = `${this.settings.api.baseUrl}${endpoint}`;
        if (fetchOptions.queryParams) {
          const queryString = this.buildQueryString(fetchOptions.queryParams);
          if (queryString) {
            fullUrl += fullUrl.includes('?') ? queryString.replace('?', '&') : queryString;
          }
        }

        // Observability
        this.logRequest(fetchOptions, fullUrl);

        const config: RequestInit = {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(!fetchOptions.skipAuth && currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
            ...fetchOptions.headers,
          },
          signal: abortSignal || controller.signal,
        };

        const response = await fetch(fullUrl, config);
        clearTimeout(id);

        // Time Synchronization
        this.handleTimeSync(response);

        if (!response.ok) {
          lastError = await this.handleErrorResponse<T>(response, endpoint, options, config, attempt, retryCount);
          continue; // Loop for retries
        }

        if (response.status === 204) {
          this.consecutiveFailures = 0;
          this.log.debug(`<<< API SUCCESS RESPONSE: 204 (No Content) ${endpoint}`);
          return undefined as T;
        }

        const responseData = await response.json();
        this.consecutiveFailures = 0;

        this.log.debug(`<<< API SUCCESS RESPONSE: ${response.status} ${endpoint}`, {
          data: responseData
        });

        // Paginated auto-extract
        let finalData = responseData;
        if (finalData && typeof finalData === 'object' && 'results' in finalData && Array.isArray(finalData.results)) {
          finalData = finalData.results;
        }

        // Cache update
        if ((fetchOptions.method === 'GET' || !fetchOptions.method) && cacheTTL > 0) {
          this.apiCache.set(cacheKey, {
            data: finalData,
            timestamp: Date.now(),
            ttl: cacheTTL
          });
        }

        return finalData as T;

      } catch (error) {
        clearTimeout(id);
        const result = await this.handleNetworkError(error, endpoint, attempt, retryCount, options, abortSignal);
        if (result === 'RETRY') {
          lastError = error;
          continue;
        }
        throw result;
      }
    }
    throw lastError;
  }

  // --- Convenience Methods ---

  get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'GET' }) as Promise<T>;
  }

  post<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }) as Promise<T>;
  }

  put<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }) as Promise<T>;
  }

  delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'DELETE' }) as Promise<T>;
  }

  patch<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }) as Promise<T>;
  }

  // --- Auth Management ---

  async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => this.subscribeTokenRefresh(resolve));
    }

    const { refresh: refreshToken } = await this.authRepo.getToken();
    if (!refreshToken) {
      this.log.warn('No refresh token available, session expired.');
      if (this.onSessionExpired) this.onSessionExpired();
      return null;
    }

    this.isRefreshing = true;
    try {
      const response = await fetch(`${this.settings.api.baseUrl}${this.settings.api.endpoints.refresh()}`, {
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
        this.onTokenRefreshed(newAccess);
        return newAccess;
      } else {
        await this.setAuthToken(null, null);
        this.onTokenRefreshed('');
        return null;
      }
    } catch (error: any) {
      const isAuthError = error?.status === 401 || error?.status === 403;
      this.currentAccessToken = null;
      this.onTokenRefreshed('');

      if (isAuthError && this.onSessionExpired) {
        this.log.warn('Refresh token failed (401/403), session expired.');
        this.onSessionExpired();
      } else if (!isAuthError) {
        this.log.warn('Refresh token failed (network/server error), NOT calling session expired.', {
          error: error?.message || error?.toString()
        });
      }
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async getAuthToken(): Promise<string | null> {
    if (this.currentAccessToken) return this.currentAccessToken;
    try {
      const { access } = await this.authRepo.getToken();
      if (access) this.currentAccessToken = access;
      return access;
    } catch (error) {
      this.log.error('Error reading token from AuthRepository', error);
      return null;
    }
  }

  async setAuthToken(token: string | null, refreshToken: string | null = null) {
    this.currentAccessToken = token;
    try {
      if (token) {
        await this.authRepo.saveToken(token, refreshToken || undefined);
      } else {
        await this.authRepo.clearToken();
      }
    } catch (error) {
      this.log.error('Error writing token to AuthRepository', error);
    }
  }

  async clearAuthToken() {
    await this.setAuthToken(null);
    this.apiCache.clear();
  }

  // --- Helpers ---

  private async handleErrorResponse<T>(
    response: Response,
    endpoint: string,
    options: RequestOptions,
    config: RequestInit,
    attempt: number,
    retryCount: number
  ): Promise<T> {
    if (!options.silentErrors) {
      this.log.error(`API Error Response: ${response.status}`, {
        endpoint,
        status: response.status,
        statusText: response.statusText
      });
    }

    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      this.log.error(`CRITICAL: Multiple consecutive API failures (${this.consecutiveFailures})`, {
        endpoint,
        status: response.status,
        threshold: this.FAILURE_THRESHOLD
      });
    }

    let errorData: ApiClientErrorData = {};
    try {
      errorData = await response.json();
      this.log.error(`<<< API ERROR RESPONSE: ${response.status}`, { endpoint, status: response.status, data: errorData });
    } catch {
      errorData = { message: response.statusText || `Error ${response.status}` };
      this.log.error(`<<< API ERROR (Could not parse body): ${response.status}`, { endpoint, status: response.status });
    }

    const error = new ApiClientError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );

    // Auth Handler
    if ((response.status === 401 || response.status === 403) && this.errorHandler && !options.skipAuthHandler) {
      const handlerRes = await this.errorHandler(error, endpoint, config);
      if (handlerRes?.retry) {
        return this.request(endpoint, { ...options, skipAuthHandler: true }) as Promise<T>;
      }
    }

    // Rate Limit
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) error.data.retry_after = parseInt(retryAfter, 10);
    }

    // Server Retry
    if (response.status >= 500 && attempt < retryCount) {
      throw error; // This will be caught by the loop
    }

    throw error;
  }

  private async handleNetworkError(
    error: any,
    endpoint: string,
    attempt: number,
    retryCount: number,
    options: RequestOptions,
    abortSignal?: AbortSignal
  ): Promise<any | 'RETRY'> {
    if (!options.silentErrors) {
      this.log.error(`Network or Request Error: ${endpoint}`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
    }

    if (error instanceof ApiClientError) return error;

    if (error instanceof Error && error.name === 'AbortError') {
      if (abortSignal?.aborted) {
        this.log.debug('Request aborted by user', { endpoint });
        return error;
      }
      this.log.warn(`Request timed out (attempt ${attempt})`, { endpoint });
      if (attempt < retryCount) return 'RETRY';
    }

    if (attempt < retryCount) return 'RETRY';

    return new ApiClientError(
      error instanceof Error ? error.message : 'Network error',
      0,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    );
  }

  private handleTimeSync(response: Response) {
    const serverDate = response.headers.get('Date');
    if (serverDate && response.ok && this.timerRepo) {
      this.timerRepo.ingestServerDate(serverDate, Date.now()).catch(e => {
        this.log.error('Failed to ingest server date', e);
      });
    }
  }

  private logRequest(options: RequestInit, fullUrl: string) {
    let parsedBody: any = null;
    try {
      parsedBody = options.body ? JSON.parse(options.body as string) : null;
      if (parsedBody && typeof parsedBody === 'object') {
        const sensitiveKeys = ['password', 'pin', 'token', 'access', 'refresh'];
        parsedBody = { ...parsedBody };
        Object.keys(parsedBody).forEach(key => {
          if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
            parsedBody[key] = '********';
          }
        });
      }
    } catch (e) {
      parsedBody = options.body;
    }

    this.log.debug(`>>> API REQUEST: ${options.method || 'GET'} ${fullUrl}`, {
      payload: parsedBody,
      headers: options.headers
    });
  }

  private buildQueryString(params: Record<string, any>): string {
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
  }

  private isTokenExpired(token: string): boolean {
    try {
      if (!token || !token.includes('.')) return true;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      const atobFunc = typeof atob !== 'undefined' ? atob : null;
      if (!atobFunc) return true;

      const jsonPayload = decodeURIComponent(
        atobFunc(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );

      const payload = JSON.parse(jsonPayload);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp - now < 60;
    } catch (error) {
      this.log.error('Error decoding token', error);
      return true;
    }
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

