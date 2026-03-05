import { ApiClientError, ApiClientErrorData } from '../api_client.errors';
import { IAuthRepository, ILogger, ISettings } from '../api_client.types';

export class AuthManager {
  private currentAccessToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private onSessionExpired: (() => void) | null = null;

  constructor(
    private authRepoGetter: () => IAuthRepository,
    private settings: ISettings,
    private log: ILogger
  ) { }

  private get authRepo(): IAuthRepository | null {
    try {
      const repo = this.authRepoGetter();
      return repo || null;
    } catch (error) {
      // AuthRepository not yet initialized (circular dependency during module loading)
      this.log.warn('AuthRepository not yet initialized, returning null');
      return null;
    }
  }

  setSessionExpiredHandler(handler: (() => void) | null) {
    this.onSessionExpired = handler;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.authRepo) {
      this.log.warn('AuthRepository not available, cannot refresh token');
      return null;
    }

    // Verificar si es un token offline antes de intentar refresh
    const { refresh: refreshToken } = await this.authRepo.getToken();
    if (refreshToken === 'offline-token' || !refreshToken) {
      this.log.info('Offline or invalid token, skipping refresh');
      // No llamar a onSessionExpired para sesiones offline
      return null;
    }

    if (this.isRefreshing) {
      return new Promise((resolve) => this.subscribeTokenRefresh(resolve));
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
      }

      await this.setAuthToken(null, null);
      this.onTokenRefreshed('');
      return null;
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
    if (!this.authRepo) {
      this.log.warn('AuthRepository not available, returning null token');
      return null;
    }
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
    if (!this.authRepo) {
      this.log.warn('AuthRepository not available, cannot save token');
      return;
    }
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
  }

  isTokenExpired(token: string): boolean {
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
}
