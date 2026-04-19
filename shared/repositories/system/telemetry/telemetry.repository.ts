import { logger } from '@/shared/utils/logger';
import { SyncAdapter } from '@core/offline-storage/sync/adapter';
import { syncWorker } from '@core/offline-storage/instance';
import { ITelemetryRepository, ITelemetryStorageAdapter } from './telemetry.ports';
import { TelemetryStorageAdapter } from './adapters/telemetry.storage.adapter';
import { TelemetryPushStrategy } from './sync/telemetry.push.strategy';
import { TelemetryEvent, TelemetryEventType, TelemetryPriority, TimeSkewData, AuthErrorContext } from './telemetry.types';
import { TelemetryScrubber } from './utils/telemetry.scrubber';

const log = logger.withTag('TELEMETRY_REPOSITORY');

const priorityToQueueValue: Record<TelemetryPriority, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
};

const CRITICAL_AUTH_ERRORS = ['DB_CONNECTION_ERROR', 'DB_QUERY_ERROR', 'SERVER_ERROR'];
const HIGH_AUTH_ERRORS = ['DEVICE_LOCKED', 'SESSION_EXPIRED', 'ACCOUNT_LOCKED', 'INVALID_CREDENTIALS'];

const MAX_BUFFER_SIZE = 1000;
const FLUSH_DEBOUNCE_MS = 100;

export class TelemetryRepository implements ITelemetryRepository {
    private initialized = false;
    private unregisterObserver: (() => void) | null = null;
    private strategyRegistered = false;
    private eventBuffer: TelemetryEvent[] = [];
    private flushScheduled = false;
    private flushInProgress = false;
    private initializationFailed = false;
    private pendingFlush: ReturnType<typeof setTimeout> | null = null;

    constructor(private readonly storage: ITelemetryStorageAdapter = new TelemetryStorageAdapter()) { }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            if (!this.strategyRegistered) {
                syncWorker.registerStrategy('telemetry', new TelemetryPushStrategy());
                this.strategyRegistered = true;
            }

            try {
                await this.storage.initialize?.();
            } catch (storageError) {
                log.warn('[TELEMETRY] Storage initialization failed, events will be buffered in memory', { error: storageError });
                this.initializationFailed = true;
            }

            this.unregisterObserver = this.registerErrorObserver();
            this.initialized = true;
            log.info('[TELEMETRY] Initialized successfully', { bufferCapacity: MAX_BUFFER_SIZE });

            if (this.eventBuffer.length > 0) {
                log.info('[TELEMETRY] Flushing buffered events on init', { count: this.eventBuffer.length });
                this.scheduleFlush();
            }
        } catch (error) {
            log.error('[TELEMETRY] Initialization failed', error);
        }
    }

    private registerErrorObserver(): () => void {
        const { registerErrorObserver } = require('@/shared/utils/logger');

        return registerErrorObserver((input: { message: string; error?: any; args: any[]; context: { tag?: string } }) => {
            const contextFromArgs = (input.args?.[0] && typeof input.args[0] === 'object') ? input.args[0] : {};
            const contextFromError = (input.error && typeof input.error === 'object' && !(input.error instanceof Error)) ? input.error : {};
            const tag = input.context?.tag || 'UNKNOWN';

            let type: TelemetryEventType = 'TEA_UPDATE_FAILURE';
            let priority: TelemetryPriority = 'HIGH';

            if (tag.includes('STORAGE')) {
                type = 'STORAGE_FULL';
                priority = 'CRITICAL';
            } else if (tag.includes('SYNC')) {
                type = 'SYNC_STALLED';
                priority = 'MEDIUM';
            } else if (input.message.toLowerCase().includes('memory')) {
                type = 'MEMORY_LEAK_WARNING';
                priority = 'MEDIUM';
            }

            const combinedContext = {
                ...contextFromArgs,
                ...contextFromError,
                loggerTag: tag,
                error: (input.error instanceof Error) ? {
                    name: input.error.name,
                    message: input.error.message
                } : undefined
            };

            this.captureError(type, input.message, combinedContext, priority);
        });
    }

    async captureError(
        type: TelemetryEventType,
        message: string,
        context: Record<string, any> = {},
        priority: TelemetryPriority = 'MEDIUM'
    ): Promise<void> {
        const scrubbedMessage = TelemetryScrubber.scrub(message);
        const scrubbedContext = TelemetryScrubber.scrub(context);

        const event: TelemetryEvent = {
            id: this.generateId(type),
            type,
            priority,
            timestamp: Date.now(),
            message: scrubbedMessage,
            context: scrubbedContext,
            traceId: scrubbedContext?.traceId,
            synced: false
        };

        this.addToBuffer(event);
        this.scheduleFlush();
    }

    private addToBuffer(event: TelemetryEvent): void {
        if (this.eventBuffer.length >= MAX_BUFFER_SIZE) {
            log.warn('[TELEMETRY] Buffer full, dropping oldest event', {
                bufferSize: this.eventBuffer.length,
                droppedEventId: this.eventBuffer[0]?.id
            });
            this.eventBuffer.shift();
        }

        this.eventBuffer.push(event);
        log.debug('[TELEMETRY] Event buffered', { eventId: event.id, bufferSize: this.eventBuffer.length });
    }

    private scheduleFlush(): void {
        if (this.flushScheduled || this.initializationFailed) {
            return;
        }

        this.flushScheduled = true;

        if (this.pendingFlush) {
            clearTimeout(this.pendingFlush);
        }

        this.pendingFlush = setTimeout(() => {
            this.flushScheduled = false;
            this.pendingFlush = null;
            this.flushToStorage();
        }, FLUSH_DEBOUNCE_MS);
    }

    private async flushToStorage(): Promise<void> {
        if (this.flushInProgress) {
            return;
        }

        this.flushInProgress = true;

        try {
            const eventsToFlush = this.eventBuffer.splice(0, this.eventBuffer.length);

            if (eventsToFlush.length === 0) {
                return;
            }

            log.info('[TELEMETRY] Flushing events to storage', { count: eventsToFlush.length });

            for (const event of eventsToFlush) {
                await this.persistEvent(event);
            }

            log.info('[TELEMETRY] Flush completed', { count: eventsToFlush.length });
        } catch (error) {
            log.error('[TELEMETRY] Flush failed, events will be retried', error);
            this.requeueEvents(this.eventBuffer.splice(0));
        } finally {
            this.flushInProgress = false;
        }
    }

    private async persistEvent(event: TelemetryEvent): Promise<void> {
        try {
            await this.storage.save(event);
        } catch (storageError) {
            log.warn('[TELEMETRY] Failed to save event to storage', storageError, { eventId: event.id });
        }

        try {
            await SyncAdapter.addToQueue({
                type: 'telemetry',
                entityId: event.id,
                priority: priorityToQueueValue[event.priority],
                status: 'pending',
                attempts: 0,
                data: event
            });
        } catch (queueError) {
            log.warn('[TELEMETRY] Failed to add event to sync queue', queueError, { eventId: event.id });
            throw queueError;
        }
    }

    private requeueEvents(events: TelemetryEvent[]): void {
        for (const event of events) {
            this.addToBuffer(event);
        }
    }

    async captureTimeSkew(data: TimeSkewData): Promise<void> {
        const driftMs = Math.abs(data.localTimestamp - data.expectedTimestamp);
        await this.captureError(
            'TIME_SKEW',
            `Clock drift detected: ${driftMs}ms`,
            {
                localTimestamp: data.localTimestamp,
                expectedTimestamp: data.expectedTimestamp,
                source: data.source,
                driftMs
            },
            'HIGH'
        );
    }

    async captureAuthError(
        errorType: string,
        message: string,
        context: AuthErrorContext,
        priority?: TelemetryPriority
    ): Promise<void> {
        const inferredPriority = priority || this.inferAuthErrorPriority(context.backendCode);

        await this.captureError(
            'AUTH_ERROR',
            message,
            {
                ...context,
                errorType,
                priority: inferredPriority
            },
            inferredPriority
        );
    }

    async captureAuthOfflineFallback(
        username: string,
        success: boolean,
        reason?: string
    ): Promise<void> {
        await this.captureError(
            'AUTH_OFFLINE_FALLBACK',
            success ? 'Offline login successful' : `Offline login failed: ${reason}`,
            {
                feature: 'AUTH',
                eventType: 'OFFLINE_FALLBACK',
                username,
                offlineSuccess: success,
                reason: reason
            },
            success ? 'LOW' : 'HIGH'
        );
    }

    async captureAuthLoginSuccess(
        username: string,
        isOffline: boolean
    ): Promise<void> {
        await this.captureError(
            'AUTH_LOGIN_SUCCESS',
            isOffline ? 'Offline login successful' : 'Online login successful',
            {
                feature: 'AUTH',
                eventType: 'LOGIN_SUCCESS',
                username,
                isOffline,
                timestamp: Date.now()
            },
            'LOW'
        );
    }

    private inferAuthErrorPriority(backendCode?: string): TelemetryPriority {
        if (backendCode && CRITICAL_AUTH_ERRORS.includes(backendCode)) {
            return 'CRITICAL';
        }
        if (backendCode && HIGH_AUTH_ERRORS.includes(backendCode)) {
            return 'HIGH';
        }
        return 'MEDIUM';
    }

    async getPendingErrors(): Promise<TelemetryEvent[]> {
        const all = await this.storage.getAll();
        return all.filter((event) => !event.synced).sort((a, b) => a.timestamp - b.timestamp);
    }

    async getErrorsByType(type: TelemetryEventType): Promise<TelemetryEvent[]> {
        const all = await this.storage.getAll();
        return all.filter((event) => event.type === type);
    }

    async markAsSynced(eventIds: string[]): Promise<void> {
        if (eventIds.length === 0) return;
        await this.storage.markSynced(eventIds);
    }

    async cleanup(retentionDays: number = 7): Promise<number> {
        return this.storage.purge(retentionDays);
    }

    dispose(): void {
        if (this.pendingFlush) {
            clearTimeout(this.pendingFlush);
            this.pendingFlush = null;
        }

        if (this.unregisterObserver) {
            this.unregisterObserver();
            this.unregisterObserver = null;
        }

        this.initialized = false;
        this.eventBuffer = [];
        this.flushScheduled = false;
        this.flushInProgress = false;
    }

    private generateId(type: TelemetryEventType): string {
        const random = Math.random().toString(36).slice(2, 10);
        return `te_${type.toLowerCase()}_${Date.now()}_${random}`;
    }

    getStatus(): { initialized: boolean; bufferSize: number; flushInProgress: boolean } {
        return {
            initialized: this.initialized,
            bufferSize: this.eventBuffer.length,
            flushInProgress: this.flushInProgress
        };
    }
}

export const telemetryRepository = new TelemetryRepository();