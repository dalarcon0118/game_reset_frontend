import { ApiClientError } from '../api_client.errors';
import NetInfo from '@react-native-community/netinfo';
import {
  ErrorHandler,
  ILogger,
  ISettings,
  ITimerRepository,
  RequestOptions
} from '../api_client.types';
import { CredentialProvider } from './credential_provider';
import { SessionCoordinator } from '@/shared/auth/session/session.coordinator';
import { SessionPolicy } from '@/shared/auth/session/session.policy';
import { SessionPolicyContext } from '@/shared/auth/session/session.types';
import { CacheManager } from './cache_manager';
import { ErrorManager } from './error_manager';
import { Transport } from '../infra/transport';

type RequestExecutionOptions = Omit<
  RequestOptions,
  'cacheTTL' | 'retryCount' | 'abortSignal' | 'timeoutProfile' | 'skipAuthHandler' | 'silentErrors'
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
  | { type: 'throw'; error: unknown };

type RetryRequestFn = <T>(endpoint: string, options: RequestOptions) => Promise<T>;

export class RequestExecutor {
  constructor(
    private credentialProvider: CredentialProvider,
    private coordinatorGetter: () => SessionCoordinator,
    private cacheManager: CacheManager,
    private errorManager: ErrorManager,
    private transport: Transport,
    private timerRepo: ITimerRepository,
    private settings: ISettings,
    private log: ILogger,
    private getErrorHandler: () => ErrorHandler | null,
    private retryRequest: RetryRequestFn
  ) { }

  async run<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const context = this.buildRequestContext(endpoint, options);
    const cached = this.getCachedResponse<T>(context);
    if (cached !== null) return cached;

    if (this.shouldAttemptAuth(endpoint, context.fetchOptions)) {
      const coordinator = this.coordinatorGetter();
      await coordinator.onRequestAuthCheck(
        endpoint,
        this.isPublicEndpoint(endpoint),
        true,
        this.runPreventiveRefresh.bind(this)
      );
    }

    return this.executeWithRetry<T>(context);
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
    if (attempt >= context.retryCount) throw outcome.error;
    return this.executeRetryLoop<T>(context, attempt + 1);
  }

  private async executeAttempt<T>(context: RequestContext, attempt: number): Promise<AttemptOutcome<T>> {
    try {
      const { response } = await this.performFetch(context, attempt);

      if (response.ok) {
        return { type: 'success', data: await this.handleSuccess<T>(response, context) };
      }

      return this.handleFailure<T>(response, context, attempt);
    } catch (error) {
      return this.handleNetworkError<T>(error, context, attempt);
    }
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
    const tokenState = SessionPolicy.resolveTokenState(token);

    // Obtener estado real de red para la política de sesión
    const netInfo = await NetInfo.fetch();
    const networkConnected = !!(netInfo.isConnected && netInfo.isInternetReachable);

    const context: SessionPolicyContext = {
      status: this.coordinatorGetter().getCurrentStatus(),
      tokenState,
      networkConnected,
      isPublicEndpoint: options.skipAuth
    };

    const shouldAttach = SessionPolicy.shouldAttachAuthorization(context);

    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(shouldAttach && token ? { 'Authorization': `Bearer ${token}` } : {}),
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
    if (finalData && typeof finalData === 'object' && 'results' in finalData && Array.isArray(finalData.results)) {
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

    const coordinator = this.coordinatorGetter();
    const authOutcome = await coordinator.onAuthError(error, context.endpoint);

    if (authOutcome.retry) {
      this.log.info(`Retrying request after auth error handling`, { endpoint: context.endpoint });
      try {
        const data = await this.retryRequest<T>(context.endpoint, context.options);
        return { type: 'success', data };
      } catch (retryError) {
        return { type: 'throw', error: retryError };
      }
    }

    return null;
  }

  private shouldRetryServerError(status: number, attempt: number, retryCount: number): boolean {
    return status >= 500 && attempt < retryCount;
  }

  private async runPreventiveRefresh(): Promise<string | null> {
    const result = await this.credentialProvider.refreshCredentials();
    return result.isOk() ? result.value : null;
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
