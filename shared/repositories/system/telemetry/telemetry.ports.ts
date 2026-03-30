import { TelemetryEvent, TelemetryEventType, TimeSkewData, TelemetryPriority } from './telemetry.types';

export interface ITelemetryRepository {
    initialize(): Promise<void>;
    captureError(type: TelemetryEventType, message: string, context?: Record<string, any>, priority?: TelemetryPriority): Promise<void>;
    captureTimeSkew(data: TimeSkewData): Promise<void>;
    getPendingErrors(): Promise<TelemetryEvent[]>;
    getErrorsByType(type: TelemetryEventType): Promise<TelemetryEvent[]>;
    markAsSynced(eventIds: string[]): Promise<void>;
    cleanup(retentionDays?: number): Promise<number>;
}

export interface ITelemetryStorageAdapter {
    save(event: TelemetryEvent): Promise<void>;
    getAll(): Promise<TelemetryEvent[]>;
    markSynced(ids: string[]): Promise<void>;
    delete(ids: string[]): Promise<void>;
    purge(retentionDays: number): Promise<number>;
}

export interface ITelemetryApiAdapter {
    sendBatch(events: TelemetryEvent[]): Promise<{ success: boolean; syncedIds: string[] }>;
}
