import { logger, registerErrorObserver } from '@/shared/utils/logger';
import { SyncAdapter } from '@core/offline-storage/sync/adapter';
import { syncWorker } from '@core/offline-storage/instance';
import { ITelemetryRepository, ITelemetryStorageAdapter } from './telemetry.ports';
import { TelemetryStorageAdapter } from './adapters/telemetry.storage.adapter';
import { TelemetryPushStrategy } from './sync/telemetry.push.strategy';
import { TelemetryEvent, TelemetryEventType, TelemetryPriority, TimeSkewData } from './telemetry.types';
import { TelemetryScrubber } from './utils/telemetry.scrubber';

const log = logger.withTag('TELEMETRY_REPOSITORY');

const priorityToQueueValue: Record<TelemetryPriority, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
};

export class TelemetryRepository implements ITelemetryRepository {
    private initialized = false;
    private unregisterObserver: (() => void) | null = null;
    private strategyRegistered = false;
    private capturingDepth = 0;

    constructor(private readonly storage: ITelemetryStorageAdapter = new TelemetryStorageAdapter()) { }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        if (!this.strategyRegistered) {
            syncWorker.registerStrategy('telemetry', new TelemetryPushStrategy());
            this.strategyRegistered = true;
        }
        this.unregisterObserver = registerErrorObserver((input) => {
            console.log(`[DEBUG_TELEMETRY] Error observer triggered: ${input.message}`, { tag: input.context?.tag });
            // Prevent infinite recursion if captureError triggers a log.error
            if (this.capturingDepth > 0) return;

            const contextFromArgs = (input.args?.[0] && typeof input.args[0] === 'object') ? input.args[0] : {};
            const contextFromError = (input.error && typeof input.error === 'object' && !(input.error instanceof Error)) ? input.error : {};
            const tag = input.context?.tag || 'UNKNOWN';

            // Refined classification based on tag and message
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
                    message: input.error.message,
                    stack: input.error.stack
                } : undefined
            };

            this.captureError(type, input.message, combinedContext, priority).catch((err) => {
                // Last resort if everything fails, we don't use logger to avoid recursion
                console.error('[TELEMETRY_CRITICAL_FAIL] Failed to capture error', err);
            });
        });
        this.initialized = true;
    }

    async captureError(
        type: TelemetryEventType,
        message: string,
        context: Record<string, any> = {},
        priority: TelemetryPriority = 'MEDIUM'
    ): Promise<void> {
        console.log(`[DEBUG_TELEMETRY] Capturing error: ${message}`, { type, traceId: context.traceId });
        try {
            this.capturingDepth++;

            // Scrub sensitive data from message and context
            const scrubbedMessage = TelemetryScrubber.scrub(message);
            const scrubbedContext = TelemetryScrubber.scrub(context);

            const event: TelemetryEvent = {
                id: this.generateId(type),
                type,
                priority,
                timestamp: Date.now(),
                message: scrubbedMessage,
                context: scrubbedContext,
                traceId: scrubbedContext.traceId,
                synced: false
            };

            await this.storage.save(event);
            const queueId = await SyncAdapter.addToQueue({
                type: 'telemetry',
                entityId: event.id,
                priority: priorityToQueueValue[priority],
                status: 'pending',
                attempts: 0,
                data: event
            });

            // Use log.debug safely since it doesn't trigger error observers
            log.debug('Telemetry event queued', { id: event.id, type: event.type, queueId });
        } catch (err) {
            // Defensive capture to prevent app crashes
            console.error('[TELEMETRY_REPOSITORY] Critical failure in captureError', err);
        } finally {
            this.capturingDepth--;
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
        if (this.unregisterObserver) {
            this.unregisterObserver();
            this.unregisterObserver = null;
        }
        this.initialized = false;
    }

    private generateId(type: TelemetryEventType): string {
        const random = Math.random().toString(36).slice(2, 10);
        return `te_${type.toLowerCase()}_${Date.now()}_${random}`;
    }
}

export const telemetryRepository = new TelemetryRepository();
