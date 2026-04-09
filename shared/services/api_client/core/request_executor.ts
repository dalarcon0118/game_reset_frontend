import { ApiClientError } from '../api_client.errors';
import NetInfo from '@react-native-community/netinfo';
import {
  ErrorHandler,
  ILogger,
  ISettings,
  TimeSyncPort,
  TimeIntegrityPort,
  ConnectivityHandler,
  RequestOptions
} from '../api_client.types';
import { CredentialProvider } from './credential_provider';
import { SessionPolicy } from '@/shared/auth/session/session.policy';
import { SessionPolicyContext, TokenState } from '@/shared/auth/session/session.types';
import { CacheManager } from './cache_manager';
import { ErrorManager } from './error_manager';
import { Transport } from '../infra';

type RequestExecutionOptions = Omit<
  RequestOptions,
  'cacheTTL' | 'retryCount' | 'abortSignal' | 'timeoutProfile' | 'skipAuthHandler' | 'silentErrors' | 'skipTimeIntegrity' | 'authRetryAttempted'
>;

type RequestContext = {
  endpoint: string;
  options: RequestOptions;
  fetchOptions: RequestExecutionOptions;
  cacheTTL: number;
  retryCount: number;
  abortSignal?: AbortSignal;
  timeout: number;
  cacheKey: string;
};

type AttemptOutcome<T> =
  | { type: 'success'; data: T }
  | { type: 'retry'; error: unknown }
  | { type: 'throw'; error: unknown }
  | { type: 'blocked'; reason: string };

type RetryRequestFn = <T>(endpoint: string, options: RequestOptions) => Promise<T>;

export class RequestExecutor {
  constructor(
    private credentialProvider: CredentialProvider,
    private cacheManager: CacheManager,
    private errorManager: ErrorManager,
    private transport: Transport,
    private timeSync: TimeSyncPort | null,
    private timeIntegrity: TimeIntegrityPort | null,
    private deviceIdProvider: () => Promise<string | null>,
    private settings: ISettings,
    private log: ILogger,
    private onConnectivity: () => ConnectivityHandler | null,
    private getErrorHandler: () => ErrorHandler | null,
    private retryRequest: RetryRequestFn
  ) { }

  async run<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const context = this.buildRequestContext(endpoint, options);
    const cached = this.getCachedResponse<T>(context);
    if (cached !== null) return cached;

    // CA-03: Time Integrity Middleware
    if (!options.skipTimeIntegrity && this.timeIntegrity) {
      const integrity = await this.timeIntegrity.validateIntegrity(Date.now());
      if (integrity.status !== 'ok') {
        this.log.error('[TIME-INTEGRITY] Request blocked due to time manipulation', {
          endpoint,
          status: integrity.status,
          deltaMs: integrity.deltaMs
        });
        throw new ApiClientError(
          `Time integrity compromised: ${integrity.status}. Delta: ${integrity.deltaMs || 0}ms`,
          403,
          { errorType: 'TIME_INTEGRITY_VIOLATION' }
        );
      }
    }

    if (this.shouldAttemptAuth(endpoint, context.fetchOptions)) {
      await this.checkAndRefreshBeforeRequest(endpoint);
    }

    return this.executeWithRetry<T>(context);
  }

  /**
   * Verifica si el token está próximo a expirar y realiza un refresh preventivo si es necesario.
   */
  private async checkAndRefreshBeforeRequest(endpoint: string): Promise<void> {
    const token = await this.credentialProvider.getAccessToken();
    const tokenState = SessionPolicy.resolveTokenState(token);

    // Obtener estado real de red para la política de sesión
    const netInfo = await NetInfo.fetch();
    const networkConnected = !!(netInfo.isConnected && netInfo.isInternetReachable);

    const context: SessionPolicyContext = {
      status: 'AUTHENTICATED', // Asumimos autenticado si estamos aquí
      tokenState,
      networkConnected,
      endpoint,
      isPublicEndpoint: false
    };

    if (SessionPolicy.shouldAttemptRefresh(context)) {
      this.log.info('[PREVENTIVE-REFRESH] Token about to expire, refreshing...', { endpoint });
      const refreshResult = await this.credentialProvider.refreshCredentials();
      if (refreshResult.isErr()) {
        this.log.warn('[PREVENTIVE-REFRESH] Refresh failed, letting request proceed to trigger 401 if needed', { error: refreshResult.error.message });
      }
    }
  }

  private buildRequestContext(endpoint: string, options: RequestOptions): RequestContext {
    const { cacheTTL = 0, retryCount = 0, abortSignal, timeoutProfile, ...fetchOptions } = options;
    return {
      endpoint,
      options,
      fetchOptions,
      cacheTTL,
      retryCount,
      abortSignal,
      timeout: this.getTimeout(timeoutProfile),
      cacheKey: this.cacheManager.buildKey({
        method: fetchOptions.method,
        endpoint,
        body: fetchOptions.body,
        queryParams: fetchOptions.queryParams
      })
    };
  }

  private getCachedResponse<T>(context: RequestContext): T | null {
    if (!this.isCacheable(context.fetchOptions.method)) {
      return null;
    }
    const cached = this.cacheManager.get<T>(context.cacheKey);
    if (cached !== null) {
      this.log.debug('Returning cached data', { endpoint: context.endpoint });
    }
    return cached;
  }

  private async executeWithRetry<T>(context: RequestContext): Promise<T> {
    return this.executeRetryLoop<T>(context, 0);
  }

  private async executeRetryLoop<T>(context: RequestContext, attempt: number): Promise<T> {
    const outcome = await this.executeAttempt<T>(context, attempt);
    if (outcome.type === 'success') return outcome.data;
    if (outcome.type === 'throw') throw outcome.error;
    if (outcome.type === 'blocked') throw new Error(outcome.reason);
    if (attempt >= context.retryCount) throw outcome.error;
    return this.executeRetryLoop<T>(context, attempt + 1);
  }

  private async executeAttempt<T>(context: RequestContext, attempt: number): Promise<AttemptOutcome<T>> {
    try {
      const { response } = await this.performFetch(context, attempt);

      // Notify connectivity sensor: any HTTP response means we are ONLINE
      this.notifyConnectivity(response.status);

      if (response.ok) {
        return { type: 'success', data: await this.handleSuccess<T>(response, context) };
      }

      return this.handleFailure<T>(response, context, attempt);
    } catch (error) {
      // Notify connectivity sensor: Network error means we might be OFFLINE
      this.notifyConnectivity(0);
      return this.handleNetworkError<T>(error, context, attempt);
    }
  }

  private notifyConnectivity(status: number) {
    const handler = this.onConnectivity();
    if (!handler) return;

    // CA-06: Filtrado de conectividad basado en semántica de sesión (SSOT)
    // Un status 401 (Unauthorized) o 403 (Forbidden) indica que el canal físico existe,
    // pero no es un canal de negocio válido hasta que se resuelva la sesión.
    // No reportamos ONLINE en estos casos para evitar ráfagas de peticiones de features.
    const isSessionError = status === 401 || status === 403;
    const type = (status > 0) ? 'ONLINE' : 'OFFLINE';


    handler({
      type,
      status: status > 0 ? status : undefined,
      timestamp: Date.now()
    });
  }

  private async performFetch(context: RequestContext, attempt: number) {
    if (attempt > 0) await this.waitForRetry(attempt, context.endpoint);

    const config = await this.prepareRequestConfig(context.fetchOptions);
    const fullUrl = this.buildFullUrl(context.endpoint, context.fetchOptions.queryParams);

    this.logRequest(context.fetchOptions, fullUrl);

    const response = await this.transport.fetchWithTimeout(
      fullUrl,
      config,
      context.timeout,
      context.abortSignal
    );

    this.handleTimeSync(response);
    return { response, config };
  }

  private async handleSuccess<T>(response: Response, context: RequestContext): Promise<T> {
    return this.processSuccessResponse<T>(
      response,
      context.endpoint,
      context.fetchOptions.method,
      context.cacheKey,
      context.cacheTTL
    );
  }

  private async handleFailure<T>(
    response: Response,
    context: RequestContext,
    attempt: number
  ): Promise<AttemptOutcome<T>> {
    const error = await this.errorManager.handleResponseError(response, context.endpoint, context.options);

    const authOutcome = await this.tryHandleAuthError<T>(response.status, error, context);
    if (authOutcome) return authOutcome;

    if (this.shouldRetryServerError(response.status, attempt, context.retryCount)) {
      return { type: 'retry', error };
    }

    return { type: 'throw', error };
  }

  private handleNetworkError<T>(error: unknown, context: RequestContext, attempt: number): AttemptOutcome<T> {
    this.log.error(`[CONNECTIVITY-SENSOR] Network error detected: ${context.endpoint}`, {
      error: error instanceof Error ? error.message : String(error),
      attempt,
      retryCount: context.retryCount
    });

    const result = this.errorManager.handleNetworkError(
      error,
      context.endpoint,
      attempt,
      context.retryCount,
      context.options,
      context.abortSignal
    );

    return result === 'RETRY'
      ? { type: 'retry', error }
      : { type: 'throw', error: result };
  }

  private getTimeout(profile?: string): number {
    if (!profile) {
      return this.settings.api.timeout;
    }
    return this.settings.api.timeoutProfiles[profile] ?? this.settings.api.timeout;
  }

  private isCacheable(method?: string): boolean {
    return !method || method === 'GET';
  }

  private shouldAttemptAuth(endpoint: string, options: RequestExecutionOptions): boolean {
    if (options.skipAuth) return false;
    if (this.isPublicEndpoint(endpoint)) return false;
    // Excluir explícitamente login y refresh para evitar bucles de dependencia
    if (endpoint.includes('/login') || endpoint.includes('/token/refresh')) return false;
    return !this.isRefreshEndpoint(endpoint);
  }

  private isPublicEndpoint(endpoint: string): boolean {
    return Boolean(this.settings.api.endpoints.public?.some((publicPath: string) => endpoint.includes(publicPath)));
  }

  private isRefreshEndpoint(endpoint: string): boolean {
    return endpoint.includes(this.settings.api.endpoints.refresh());
  }

  private async waitForRetry(attempt: number, endpoint: string): Promise<void> {
    const delay = Math.pow(2, attempt) * 1000;
    this.log.debug(`Retrying request (attempt ${attempt}) after ${delay}ms`, { endpoint });
    await this.sleep(delay);
  }

  private buildFullUrl(endpoint: string, queryParams?: Record<string, any>): string {
    const queryString = this.cacheManager.getQueryString(queryParams);
    let url = `${this.settings.api.baseUrl}${endpoint}`;
    if (queryString) {
      url += url.includes('?') ? queryString.replace('?', '&') : queryString;
    }
    return url;
  }

  private async prepareRequestConfig(options: RequestExecutionOptions): Promise<RequestInit> {
    this.log.debug('[Preparing request config...]', options);

    const token = await this.credentialProvider.getAccessToken();
    const confirmationToken = await this.credentialProvider.getConfirmationToken();
    const tokenState = SessionPolicy.resolveTokenState(token);

    // Obtener estado real de red para la política de sesión
    const netInfo = await NetInfo.fetch();
    const networkConnected = !!(netInfo.isConnected && netInfo.isInternetReachable);

    const context: SessionPolicyContext = {
      status: 'AUTHENTICATED', // Simplificación para la política
      tokenState,
      networkConnected,
      isPublicEndpoint: options.skipAuth
    };

    const shouldAttach = SessionPolicy.shouldAttachAuthorization(context);
    this.log.debug('[AUTH-HEADERS] Resolution', {
      shouldAttachAuthorization: shouldAttach,
      hasAccessToken: Boolean(token),
      hasConfirmationToken: Boolean(confirmationToken)
    });

    const deviceId = await this.deviceIdProvider();

    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(shouldAttach && token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(shouldAttach && confirmationToken ? { 'X-Confirmation-Token': confirmationToken } : {}),
        ...(deviceId ? { 'X-Device-Id': deviceId } : {}),
        ...options.headers,
      },
    };
  }

  private async processSuccessResponse<T>(
    response: Response,
    endpoint: string,
    method: string | undefined,
    cacheKey: string,
    cacheTTL: number
  ): Promise<T> {
    this.errorManager.resetConsecutiveFailures();
    if (response.status === 204) {
      this.log.debug(`<<< API SUCCESS RESPONSE: 204 (No Content) ${endpoint}`);
      return undefined as T;
    }
    const responseData = await response.json();
    this.log.debug(`<<< API SUCCESS RESPONSE: ${response.status} ${endpoint}`, { data: responseData });
    let finalData = responseData;

    if (finalData && typeof finalData === 'object' && 'data' in finalData && finalData.data) {
      const innerData = finalData.data;
      if (Array.isArray(innerData)) {
        finalData = innerData;
      } else if (typeof innerData === 'object' && 'results' in innerData && Array.isArray(innerData.results)) {
        finalData = innerData.results;
      }
    } else if (finalData && typeof finalData === 'object' && 'results' in finalData && Array.isArray(finalData.results)) {
      finalData = finalData.results;
    }

    if (this.isCacheable(method) && cacheTTL > 0) {
      this.cacheManager.set(cacheKey, finalData, cacheTTL);
    }
    return finalData as T;
  }

  private async tryHandleAuthError<T>(
    status: number,
    error: ApiClientError,
    context: RequestContext
  ): Promise<AttemptOutcome<T> | null> {
    if (status !== 401 && status !== 403) return null;
    if (context.options.skipAuthHandler) return null;

    this.log.warn(`Auth error ${status} on ${context.endpoint}`);

    if (context.options.authRetryAttempted) {
      this.log.warn('[REACTIVE-REFRESH] Retry already attempted, skipping second refresh', {
        endpoint: context.endpoint
      });
      const globalHandler = this.getErrorHandler();
      if (globalHandler) {
        await globalHandler(error, context.endpoint, context.options);
      }
      return null;
    }

    // Check if this is an offline session - if so, don't try to refresh
    const token = await this.credentialProvider.getAccessToken();
    const tokenState = SessionPolicy.resolveTokenState(token);
    const isOfflineSession = tokenState === TokenState.OFFLINE_MARKER;

    // Solo intentamos refresh reactivo para errores 401 y solo si no es offline
    if (status === 401 && !isOfflineSession) {
      this.log.info(`[REACTIVE-REFRESH] Attempting to refresh token after 401...`, { endpoint: context.endpoint });
      const refreshResult = await this.credentialProvider.refreshCredentials();

      if (refreshResult.isOk()) {
        this.log.info(`[REACTIVE-REFRESH] Success, retrying request`, { endpoint: context.endpoint });
        try {
          const data = await this.retryRequest<T>(context.endpoint, {
            ...context.options,
            authRetryAttempted: true
          });
          return { type: 'success', data };
        } catch (retryError) {
          return { type: 'throw', error: retryError };
        }
      }
    } else if (isOfflineSession) {
      if (status === 401) {
        // Para sesiones offline, si el backend devuelve 401, significa que hay red 
        // pero las credenciales no existen o son inválidas. Debemos forzar login online.
        this.log.info(`[AUTH] Offline session hit 401. Forcing global handler to require online login.`);
        const globalHandler = this.getErrorHandler();
        if (globalHandler) {
          await globalHandler(error, context.endpoint, context.options);
        }
      } else {
        // Para otros errores (ej. 403, 500, etc), seguimos protegiendo la sesión
        this.log.info(`[AUTH] Offline session - skipping global handler for ${status} error`);
      }
      return null;
    }

    // Si llegamos aquí, el refresh falló o no era un 401.
    // Solo invocamos el globalHandler para errores 401/403 (autenticación)
    // 504 y otros errores de servidor NO deben disparar logout
    if (status === 401 || status === 403) {
      const globalHandler = this.getErrorHandler();
      if (globalHandler) {
        await globalHandler(error, context.endpoint, context.options);
      }
    }

    return null;
  }

  private shouldRetryServerError(status: number, attempt: number, retryCount: number): boolean {
    return status >= 500 && attempt < retryCount;
  }

  private handleTimeSync(response: Response) {
    const serverDate = response.headers.get('Date');
    if (serverDate && response.ok && this.timeSync) {
      this.timeSync.ingestServerDate(serverDate, Date.now()).catch((e: unknown) => {
        this.log.error('Failed to ingest server date', e);
      });
    }
  }

  private logRequest(options: RequestInit, fullUrl: string) {
    let parsedBody: unknown = null;
    try {
      parsedBody = options.body ? JSON.parse(options.body as string) : null;
      if (parsedBody && typeof parsedBody === 'object') {
        const sensitiveKeys = ['password', 'pin', 'token', 'access', 'refresh'];
        const sanitizedBody = { ...(parsedBody as Record<string, unknown>) };
        Object.keys(sanitizedBody).forEach(key => {
          if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
            sanitizedBody[key] = '********';
          }
        });
        parsedBody = sanitizedBody;
      }
    } catch {
      parsedBody = options.body;
    }
    this.log.debug(`>>> API REQUEST: ${options.method || 'GET'} ${fullUrl}`, {
      payload: parsedBody,
      headers: options.headers
    });
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
