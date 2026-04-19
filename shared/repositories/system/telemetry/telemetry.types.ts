export type TelemetryEventType = 
  | 'TEA_UPDATE_FAILURE'
  | 'TIME_SKEW'
  | 'STORAGE_FULL'
  | 'SYNC_STALLED'
  | 'MEMORY_LEAK_WARNING'
  | 'AUTH_ERROR'
  | 'AUTH_OFFLINE_FALLBACK'
  | 'AUTH_LOGIN_SUCCESS';

export type TelemetryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TelemetryEvent {
    id: string;
    type: TelemetryEventType;
    priority: TelemetryPriority;
    timestamp: number;
    message: string;
    context: Record<string, any>;
    traceId?: string;
    synced: boolean;
}

export interface TimeSkewData {
    localTimestamp: number;
    expectedTimestamp: number;
    source: string;
}

export interface TelemetryBatch {
    events: TelemetryEvent[];
    deviceInfo: Record<string, any>;
}

export interface AuthErrorContext {
    feature: 'AUTH';
    errorType: string;
    backendCode?: string;
    status?: number;
    username: string;
    offlineAttempt: boolean;
    offlineSuccess?: boolean;
    retryCount?: number;
    extra?: Record<string, any>;
}
