
import {
  RequestOptions,
  ErrorHandler,
  IAuthRepository,
  ITimerRepository,
  ILogger,
  ISettings
} from './api_client.types';
import { ApiClientError } from './api_client.errors';
import { CredentialProvider } from './core/credential_provider';
import { SessionPolicy } from '@/shared/auth/session/session.policy';
import { TokenState } from '@/shared/auth/session/session.types';
import { CacheManager } from './core/cache_manager';
import { ErrorManager } from './core/error_manager';
import { RequestExecutor } from './core/request_executor';
import { Transport } from './infra/transport';

// --- API Client Class ---

export class ApiClient {
  private credentialProvider: CredentialProvider;
  private cacheManager = new CacheManager();
  private errorManager: ErrorManager;
  private transport = new Transport();
  private requestExecutor: RequestExecutor;

  private errorHandler: ErrorHandler | null = null;

  constructor(
    authRepoGetter: () => IAuthRepository,
    timerRepo: ITimerRepository,
    settings: ISettings,
    private log: ILogger
  ) {
    this.credentialProvider = new CredentialProvider(authRepoGetter, settings, log);
    this.errorManager = new ErrorManager(log);
    this.requestExecutor = new RequestExecutor(
      this.credentialProvider,
      this.cacheManager,
      this.errorManager,
      this.transport,
      timerRepo,
      settings,
      log,
      () => this.errorHandler,
      <T>(endpoint: string, options: RequestOptions) => this.request<T>(endpoint, options)
    );

    // Bind methods to prevent 'undefined' when called from destructuring or early imports
    this.request = this.request.bind(this);
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
    this.patch = this.patch.bind(this);
    this.setErrorHandler = this.setErrorHandler.bind(this);
    this.setSessionExpiredHandler = this.setSessionExpiredHandler.bind(this);
    this.setupAuthErrorHandler = this.setupAuthErrorHandler.bind(this);
    this.isTokenExpired = this.isTokenExpired.bind(this);
  }

  // --- Public Handlers ---

  setErrorHandler(handler: ErrorHandler | null) {
    this.errorHandler = handler;
  }

  setSessionExpiredHandler(handler: () => void) {
    if (!this.credentialProvider) {
      this.log.error('credentialProvider is undefined in setSessionExpiredHandler');
      return;
    }
    this.credentialProvider.setSessionExpiredHandler(handler);
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
    //Logs just the part of the enpoint after the base url
    const endpointWithoutBase = endpoint.replace(this.credentialProvider.getSettings().api.baseUrl, '');
    this.log.debug('[Request-Started]', endpointWithoutBase, options);
    const response = await this.requestExecutor.run<T>(endpoint, options);
    this.log.debug('[Request-Completed]', endpointWithoutBase);
    return response;
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
    const result = await this.credentialProvider.refreshCredentials();
    return result.isOk() ? result.value : null;
  }

  async getAuthToken(): Promise<string | null> {
    if (!this.credentialProvider) {
      this.log.warn('credentialProvider is undefined in getAuthToken');
      return null;
    }
    return this.credentialProvider.getAccessToken();
  }

  isTokenExpired(token: string): boolean {
    return SessionPolicy.resolveTokenState(token) === TokenState.EXPIRED;
  }

  async setAuthToken(token: string | null, refreshToken: string | null = null) {
    return this.credentialProvider.persistCredentials(token || '', refreshToken || '');
  }

  async clearAuthToken() {
    await this.credentialProvider.clearCredentials();
    this.cacheManager.clear();
  }
}
