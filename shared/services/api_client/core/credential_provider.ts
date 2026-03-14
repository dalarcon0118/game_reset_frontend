import { Result, ok, err, ResultAsync } from 'neverthrow';
import { ApiClientError, ApiClientErrorData } from '../api_client.errors';
import { TokenStoragePort, ILogger, ISettings } from '../api_client.types';

/**
 * CredentialProvider: Proveedor de credenciales STATELESS.
 * No mantiene estado interno (currentAccessToken), siempre consulta al repositorio.
 * Implementa el flujo de refresh usando ROP.
 */
export class CredentialProvider {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private sessionExpiredHandler: (() => void) | null = null;

  constructor(
    private tokenStorageGetter: () => TokenStoragePort,
    private settings: ISettings,
    private log: ILogger
  ) {
    this.log = log.withTag ? log.withTag('CredentialProvider') : log;
  }

  getSettings(): ISettings {
    return this.settings;
  }
  setSessionExpiredHandler(handler: () => void) {
    this.sessionExpiredHandler = handler;
  }

  async persistCredentials(access: string, refresh: string): Promise<void> {
    const repoRes = this.tokenStorage;
    if (repoRes.isOk()) {
      await repoRes.value.saveToken(access, refresh);
    }
  }

  private get tokenStorage(): Result<TokenStoragePort, Error> {
    try {
      const storage = this.tokenStorageGetter();
      if (!storage) return err(new Error('TokenStorage not available'));
      return ok(storage);
    } catch (error) {
      return err(new Error('TokenStorage not initialized'));
    }
  }

  /**
   * Obtiene el token de acceso actual desde el almacenamiento.
   */
  async getAccessToken(): Promise<string | null> {
    const repoRes = this.tokenStorage;
    if (repoRes.isErr()) return null;

    try {
      const { access } = await repoRes.value.getToken();
      return access;
    } catch (error) {
      this.log.error('Error reading access token', error);
      return null;
    }
  }

  /**
   * Obtiene el token de refresh actual desde el almacenamiento.
   */
  async getRefreshToken(): Promise<string | null> {
    const repoRes = this.tokenStorage;
    if (repoRes.isErr()) return null;

    try {
      const { refresh } = await repoRes.value.getToken();
      return refresh;
    } catch (error) {
      this.log.error('Error reading refresh token', error);
      return null;
    }
  }

  /**
   * Ejecuta el flujo de refresh de credenciales.
   */
  async refreshCredentials(): Promise<Result<string, Error>> {
    this.log.info('Starting refresh flow...');

    if (this.isRefreshing) {
      this.log.debug('Refresh already in progress, queuing request');
      return new Promise<Result<string, Error>>((resolve) => {
        this.refreshSubscribers.push((token) => {
          token ? resolve(ok(token)) : resolve(err(new Error('QUEUED_REFRESH_FAILED')));
        });
      });
    }

    this.isRefreshing = true;

    const refreshToken = await this.getRefreshToken();
    if (!refreshToken || refreshToken === 'offline-token') {
      this.isRefreshing = false;
      this.notifySubscribers('');
      return err(new Error(refreshToken === 'offline-token' ? 'OFFLINE_SESSION' : 'NO_REFRESH_TOKEN'));
    }

    const result = await ResultAsync.fromPromise(
      repoRes.value.refresh(),
      (e: any) => e instanceof Error ? e : new Error(String(e))
    ).map(res => {
      if (!res.success) throw new Error(res.error.message);
      return res.data?.accessToken || '';
    });

    this.isRefreshing = false;

    if (result.isOk()) {
      this.log.info('Refresh success');
      this.notifySubscribers(result.value);
    } else {
      this.log.error('Refresh failed', { error: result.error.message });
      this.notifySubscribers('');
      // No necesitamos llamar a sessionExpiredHandler aquí porque AuthRepository ya notificó a sus listeners
    }

    return result;
  }

  private notifySubscribers(token: string) {
    this.refreshSubscribers.forEach(cb => cb(token));
    this.refreshSubscribers = [];
  }

  /**
   * Limpia las credenciales del almacenamiento.
   */
  async clearCredentials(): Promise<void> {
    const repoRes = this.authRepo;
    if (repoRes.isOk()) {
      await repoRes.value.clearToken();
    }
  }
}
