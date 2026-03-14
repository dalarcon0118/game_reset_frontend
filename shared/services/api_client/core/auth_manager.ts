import { Result, ok, err, ResultAsync, okAsync } from 'neverthrow';
import { ApiClientError, ApiClientErrorData } from '../api_client.errors';
import { IAuthRepository, ILogger, ISettings } from '../api_client.types';
import { SessionPolicy } from '../../../auth/session/session.policy';
import { TokenState } from '../../../auth/session/session.types';

export class AuthManager {
  private currentAccessToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private onSessionExpired: (() => void) | null = null;
  private trustedNowGetter: (() => number) | null = null;

  constructor(
    private authRepoGetter: () => IAuthRepository,
    private settings: ISettings,
    private log: ILogger
  ) { }

  setTrustedNowGetter(getter: () => number) {
    this.trustedNowGetter = getter;
  }

  private get authRepo(): Result<IAuthRepository, Error> {
    try {
      const repo = this.authRepoGetter();
      if (!repo) return err(new Error('AuthRepository not available'));
      return ok(repo);
    } catch (error) {
      this.log.warn('AuthRepository not yet initialized');
      return err(new Error('AuthRepository not initialized'));
    }
  }

  setSessionExpiredHandler(handler: (() => void) | null) {
    this.onSessionExpired = handler;
  }

  /**
   * Refreshes the access token using the refresh token.
   * Uses Railway Oriented Programming (ROP) with neverthrow.
   */
  async refreshAccessToken(): Promise<string | null> {
    this.log.debug('[AuthManager] Starting refreshAccessToken flow...', { isRefreshing: this.isRefreshing });

    const result = await this.getRefreshToken()
      .andThen(refreshToken => this.validateRefreshToken(refreshToken))
      .andThen(refreshToken => this.performRefreshRequest(refreshToken))
      .andThen(tokens => this.persistNewTokens(tokens))
      .map(newAccess => {
        this.log.info('[AuthManager] Token refreshed successfully', { hasNewRefresh: !!newAccess });
        this.onTokenRefreshed(newAccess);
        return newAccess;
      })
      .mapErr(error => {
        this.log.error('[AuthManager] Refresh flow failed', { error: error.message });
        this.handleRefreshError(error);
        return error;
      });

    return result.isOk() ? result.value : null;
  }

  private getRefreshToken(): ResultAsync<string, Error> {
    return ResultAsync.fromPromise(
      (async () => {
        const repoRes = this.authRepo;
        if (repoRes.isErr()) throw repoRes.error;
        const { refresh } = await repoRes.value.getToken();
        if (!refresh) throw new Error('NO_REFRESH_TOKEN');
        return refresh as string;
      })(),
      (e: any) => e instanceof Error ? e : new Error(String(e))
    );
  }

  private validateRefreshToken(token: string): Result<string, Error> {
    if (token === 'offline-token') {
      this.log.info('[AuthManager] Offline token detected, skipping refresh');
      return err(new Error('OFFLINE_SESSION'));
    }
    return ok(token);
  }

  private performRefreshRequest(refreshToken: string): ResultAsync<{ access: string; refresh: string | null }, Error> {
    if (this.isRefreshing) {
      this.log.debug('[AuthManager] Refresh already in progress, subscribing...');
      return ResultAsync.fromPromise(
        new Promise<string>((resolve) => this.subscribeTokenRefresh(resolve)),
        () => new Error('REFRESH_SUBSCRIPTION_FAILED')
      ).map(access => ({ access, refresh: null }));
    }

    this.isRefreshing = true;
    const p = (async () => {
      try {
        const url = `${this.settings.api.baseUrl}${this.settings.api.endpoints.refresh()}`;
        const response = await fetch(url, {
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
        if (!data?.access) throw new Error('INVALID_REFRESH_RESPONSE');

        return { access: data.access as string, refresh: (data.refresh ?? null) as string | null };
      } finally {
        this.isRefreshing = false;
      }
    })();

    return ResultAsync.fromPromise(
      p,
      (e: any) => e instanceof Error ? e : new Error(String(e))
    );
  }

  private persistNewTokens(tokens: { access: string; refresh: string | null }): ResultAsync<string, Error> {
    return ResultAsync.fromPromise(
      (async () => {
        await this.setAuthToken(tokens.access, tokens.refresh);
        return tokens.access;
      })(),
      () => new Error('FAILED_TO_PERSIST_TOKENS')
    );
  }

  private handleRefreshError(error: Error) {
    const isAuthError = error instanceof ApiClientError && (error.status === 401 || error.status === 403);

    this.currentAccessToken = null;
    this.onTokenRefreshed('');

    if (isAuthError && this.onSessionExpired) {
      this.log.warn('[AuthManager] Refresh failed with auth error, session expired');
      this.onSessionExpired();
    } else {
      this.log.warn('[AuthManager] Refresh failed with non-auth error', { error: error.message });
    }
  }

  async getAuthToken(): Promise<string | null> {
    if (this.currentAccessToken) return this.currentAccessToken;

    const repoRes = this.authRepo;
    if (repoRes.isErr()) return null;

    try {
      const { access } = await repoRes.value.getToken();
      if (access) this.currentAccessToken = access;
      return access;
    } catch (error) {
      this.log.error('Error reading token from AuthRepository', error);
      return null;
    }
  }

  async setAuthToken(token: string | null, refreshToken: string | null = null) {
    this.currentAccessToken = token;
    const repoRes = this.authRepo;
    if (repoRes.isErr()) return;

    try {
      if (token) {
        await repoRes.value.saveToken(token, refreshToken || undefined);
      } else {
        await repoRes.value.clearToken();
      }
    } catch (error) {
      this.log.error('Error writing token to AuthRepository', error);
    }
  }

  async clearAuthToken() {
    await this.setAuthToken(null);
  }

  /**
   * Decodes JWT and checks if it's expired.
   * Declarative implementation with safety checks.
   */
  isTokenExpired(token: string | null): boolean {
    const trustedNow = this.trustedNowGetter ? this.trustedNowGetter() : undefined;
    const state = SessionPolicy.resolveTokenState(token, trustedNow);
    
    if (state === TokenState.EXPIRED) {
      this.log.debug('[AuthManager] Token is expired according to policy');
      return true;
    }
    
    return false;
  }

  private decodeToken(token: string): Result<any, Error> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return err(new Error('INVALID_JWT_STRUCTURE'));

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Native atob check with fallback for APK environments
      let atobFunc: (s: string) => string;

      if (typeof global !== 'undefined' && (global as any).atob) {
        atobFunc = (global as any).atob;
      } else if (typeof atob !== 'undefined') {
        atobFunc = atob;
      } else {
        // Fallback using Buffer if available (unlikely in pure RN but good for consistency)
        try {
          const Buffer = require('buffer').Buffer;
          atobFunc = (s: string) => Buffer.from(s, 'base64').toString('binary');
        } catch {
          this.log.error('[AuthManager] atob not available in this environment');
          return err(new Error('ATOB_NOT_AVAILABLE'));
        }
      }

      const decoded = atobFunc(base64);
      const jsonPayload = decodeURIComponent(
        decoded.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );

      return ok(JSON.parse(jsonPayload));
    } catch (error) {
      this.log.error('[AuthManager] Failed to decode token', { error: error instanceof Error ? error.message : String(error) });
      return err(new Error('INVALID_TOKEN_FORMAT'));
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

// Helper for errAsync since neverthrow version might vary
const errAsync = <T, E>(e: E): ResultAsync<T, E> => {
  return ResultAsync.fromPromise(Promise.reject(e), (err: any) => err as E);
};

