import { TelemetryEvent, TelemetryEventType, TimeSkewData, TelemetryPriority, AuthErrorContext } from './telemetry.types';

export interface ITelemetryRepository {
    initialize(): Promise<void>;
    captureError(type: TelemetryEventType, message: string, context?: Record<string, any>, priority?: TelemetryPriority): Promise<void>;
    captureTimeSkew(data: TimeSkewData): Promise<void>;
    captureAuthError(errorType: string, message: string, context: AuthErrorContext, priority?: TelemetryPriority): Promise<void>;
    captureAuthOfflineFallback(username: string, success: boolean, reason?: string): Promise<void>;
    captureAuthLoginSuccess(username: string, isOffline: boolean): Promise<void>;
    getPendingErrors(): Promise<TelemetryEvent[]>;
    getErrorsByType(type: TelemetryEventType): Promise<TelemetryEvent[]>;
    markAsSynced(eventIds: string[]): Promise<void>;
    cleanup(retentionDays?: number): Promise<number>;
}

export interface ITelemetryStorageAdapter {
    initialize?(): Promise<void>;
    save(event: TelemetryEvent): Promise<void>;
    getAll(): Promise<TelemetryEvent[]>;
    markSynced(ids: string[]): Promise<void>;
    delete(ids: string[]): Promise<void>;
    purge(retentionDays: number): Promise<number>;
}

export interface ITelemetryApiAdapter {
    sendBatch(events: TelemetryEvent[]): Promise<{ success: boolean; syncedIds: string[] }>;
}
