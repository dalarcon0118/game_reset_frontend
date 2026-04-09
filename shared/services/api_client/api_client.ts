
import {
  RequestOptions,
  ErrorHandler,
  ConnectivityHandler,
  TokenStoragePort,
  TimeSyncPort,
  TimeIntegrityPort,
  IDeviceRepository,
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
import { Transport } from './infra';

export interface ApiClientConfig {
  tokenStorageGetter?: () => TokenStoragePort;
  deviceIdProvider?: () => Promise<string | null>;
  timeSync?: TimeSyncPort;
  timeIntegrity?: TimeIntegrityPort;
  settings?: ISettings;
  log?: ILogger;
  onConnectivity?: ConnectivityHandler;
}

// --- API Client Class ---

export class ApiClient {
  private credentialProvider: CredentialProvider;
  private cacheManager = new CacheManager();
  private errorManager: ErrorManager;
  private transport = new Transport();
  private requestExecutor: RequestExecutor;

  private errorHandler: ErrorHandler | null = null;
  private connectivityHandler: ConnectivityHandler | null = null;

  constructor(
    private tokenStorageGetter: () => TokenStoragePort,
    private settings: ISettings | null = null,
    private log: ILogger | null = null,
    private timeSync?: TimeSyncPort,
    private timeIntegrity?: TimeIntegrityPort,
    private deviceIdProvider?: () => Promise<string | null>,
    onConnectivity?: ConnectivityHandler
  ) {
    if (onConnectivity) {
      this.connectivityHandler = onConnectivity;
    }
    if (settings && log) {
      this.credentialProvider = new CredentialProvider(tokenStorageGetter, settings, log);
      this.errorManager = new ErrorManager(log);
      
      // CA-05: Validación de integridad de infraestructura (Defensa en Profundidad)
      const safeDeviceIdProvider = () => {
        if (!this.deviceIdProvider) {
          log.error('[INFRASTRUCTURE-ERROR] DeviceIdProvider is missing in ApiClient configuration.');
          throw new Error('ApiClient requires a DeviceIdProvider for secure operations.');
        }
        return this.deviceIdProvider();
      };

      this.requestExecutor = new RequestExecutor(
        this.credentialProvider,
        this.cacheManager,
        this.errorManager,
        this.transport,
        timeSync || null,
        timeIntegrity || null,
        safeDeviceIdProvider,
        settings,
        log,
        () => this.connectivityHandler,
        () => this.errorHandler,
        <T>(endpoint: string, options: RequestOptions) => this.request<T>(endpoint, options)
      );
    } else {
      // Lazy initialization on first config() call
      this.credentialProvider = null as any;
      this.errorManager = null as any;
      this.requestExecutor = null as any;
    }

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
    this.config = this.config.bind(this);
  }

  /**
   * Configures global dependencies for the API Client.
   * This allows decoupled injection from core modules.
   */
  config(config: ApiClientConfig) {
    if (config.log) {
      this.log = config.log;
    }
    if (config.tokenStorageGetter) {
      this.tokenStorageGetter = config.tokenStorageGetter;
    }
    if (config.deviceIdProvider) {
      this.deviceIdProvider = config.deviceIdProvider;
    }
    if (config.timeSync) {
      this.timeSync = config.timeSync;
    }
    if (config.timeIntegrity) {
      this.timeIntegrity = config.timeIntegrity;
    }
    if (config.settings) {
      this.settings = config.settings;
    }
    if (config.onConnectivity) {
      this.connectivityHandler = config.onConnectivity;
    }

    if (!this.settings || !this.log) {
      // Allow partial configuration for event handlers if core deps are missing
      if (config.onConnectivity && !this.settings && !this.log) {
        // Store handler but don't throw yet
        this.connectivityHandler = config.onConnectivity;
        return;
      }
      throw new Error('[API_CLIENT] Cannot configure without settings and log');
    }

    this.credentialProvider = new CredentialProvider(
      this.tokenStorageGetter,
      this.settings,
      this.log
    );

    this.errorManager = new ErrorManager(this.log);

    // Update RequestExecutor with new dependencies
    this.requestExecutor = new RequestExecutor(
      this.credentialProvider,
      this.cacheManager,
      this.errorManager,
      this.transport,
      this.timeSync || null,
      this.timeIntegrity || null,
      this.deviceIdProvider || (() => Promise.resolve(null)),
      this.settings,
      this.log,
      () => this.connectivityHandler,
      () => this.errorHandler,
      <T>(endpoint: string, options: RequestOptions) => this.request<T>(endpoint, options)
    );

    this.log.info('[API_CLIENT] Global configuration updated');
  }

  // --- Public Handlers ---

  setErrorHandler(handler: ErrorHandler | null) {
    this.errorHandler = handler;
  }

  setSessionExpiredHandler(handler: () => void) {
    if (!this.log) return;
    if (!this.credentialProvider) {
      this.log.error('credentialProvider is undefined in setSessionExpiredHandler');
      return;
    }
    this.credentialProvider.setSessionExpiredHandler(handler);
  }

  setupAuthErrorHandler(logoutCallback: () => Promise<void>) {
    this.setErrorHandler(async (error: ApiClientError, endpoint: string) => {
      if (!this.log) return { retry: false };
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
    if (!this.requestExecutor || !this.credentialProvider || !this.log || !this.settings) {
      throw new Error('[API_CLIENT] ApiClient accessed before global configuration (config())');
    }
    //Logs just the part of the enpoint after the base url
    const endpointWithoutBase = endpoint.replace(this.settings.api.baseUrl, '');
    this.log.info(`[API_CLIENT] Request starting: ${endpointWithoutBase}`);
    return this.requestExecutor.run<T>(endpoint, options);
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
    if (!this.credentialProvider || !this.log) {
      if (this.log) this.log.warn('credentialProvider is undefined in getAuthToken');
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

  /**
   * Expone la funcionalidad de traducción de errores del ErrorManager
   * para su uso externo (ej: CoreService)
   */
  translateError(status: number, technicalMessage?: string): string {
    if (!this.errorManager) {
      this.log?.warn('ErrorManager not initialized, returning fallback message');
      return 'Ocurrió un error inesperado.';
    }

    return this.errorManager.translateError(status, technicalMessage);
  }
}
