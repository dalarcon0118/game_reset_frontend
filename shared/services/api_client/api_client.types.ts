
export interface RequestOptions extends RequestInit {
  skipAuthHandler?: boolean;
  skipAuth?: boolean; // New flag to skip token validation and attachment
  skipTimeIntegrity?: boolean; // New flag to skip time integrity check (e.g. for public endpoints or sync)
  silentErrors?: boolean; // New flag to suppress error logging for expected failures
  authRetryAttempted?: boolean; // Internal guard to avoid infinite reactive refresh loops
  cacheTTL?: number; // In milliseconds
  retryCount?: number;
  abortSignal?: AbortSignal;
  timeoutProfile?: 'FAST' | 'NORMAL' | 'SLOW';
  queryParams?: Record<string, any>; // Optional query parameters
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export type ErrorHandlerResponse = { retry: boolean; newToken?: string } | null;
export type ErrorHandler = (error: any, endpoint: string, options: RequestInit) => Promise<ErrorHandlerResponse>;

export type ConnectivityEvent = {
  type: 'ONLINE' | 'OFFLINE';
  status?: number;
  timestamp: number;
};

export type ConnectivityHandler = (event: ConnectivityEvent) => void;

export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  withTag?(tag: string): any; // Made optional to support results from withTag() itself
}

export interface ISettings {
  api: {
    baseUrl: string;
    timeout: number;
    timeoutProfiles: Record<string, number>;
    defaults: {
      cacheTTL: number;
      retryCount: number;
    };
    endpoints: {
      public?: string[];
      refresh: () => string;
      [key: string]: any;
    };
  };
}

export interface IDeviceRepository {
  getUniqueId(): Promise<string>;
}

// Minimal interface for Time ingestion to avoid circular dependency
export interface TimeSyncPort {
  ingestServerDate(dateHeader: string | null, clientNow: number): Promise<void>;
}

export interface TimeIntegrityPort {
  validateIntegrity(clientNow: number): { status: 'ok' | 'backward' | 'jump'; deltaMs?: number } | Promise<{ status: 'ok' | 'backward' | 'jump'; deltaMs?: number }>;
}

// Minimal interface for Token management to avoid business logic coupling
export interface TokenStoragePort {
  getToken(): Promise<{ access: string | null; refresh: string | null; confirmationToken?: string | null }>;
  saveToken(access: string, refresh?: string, confirmationToken?: string): Promise<void>;
  clearToken(): Promise<void>;
}

export interface IAuthRepository extends TokenStoragePort {
  login(username: string, pin: string): Promise<any>;
  logout(): Promise<void>;
  getUserIdentity(): Promise<any | null>;
  checkAuth(): Promise<void>;
  onSessionChange(callback: (user: any | null) => void): () => void;
  onSessionExpired(callback: (reason: string) => void): () => void;
  onTokenRefreshed(callback: (token: string) => void): () => void;
  getLastUsername(): Promise<string | null>;
}
