import { SyncOutcome, SyncQueueItem, SyncStrategy } from '@core/offline-storage/types';
import { TelemetryApiAdapter } from '../adapters/telemetry.api.adapter';
import { TelemetryStorageAdapter } from '../adapters/telemetry.storage.adapter';
import { TelemetryEvent } from '../telemetry.types';

export class TelemetryPushStrategy implements SyncStrategy {
    private readonly api = new TelemetryApiAdapter();
    private readonly storage = new TelemetryStorageAdapter();

    async push(item: SyncQueueItem): Promise<SyncOutcome> {
        return this.pushBatch([item]).then((results) => results[0]);
    }

    async pushBatch(items: SyncQueueItem[]): Promise<SyncOutcome[]> {
        console.log(`[DEBUG_TELEMETRY] Push strategy triggered for ${items.length} items`);
        const events: TelemetryEvent[] = items
            .map((item) => item.data as TelemetryEvent | undefined)
            .filter((event): event is TelemetryEvent => Boolean(event));

        if (events.length === 0) {
            return items.map(() => ({ type: 'FATAL_ERROR', reason: 'No telemetry payload' }));
        }

        try {
            const response = await this.api.sendBatch(events);
            await this.storage.markSynced(response.syncedIds);
            return items.map(() => ({ type: 'SUCCESS' }));
        } catch (error: any) {
            const reason = error?.message || 'Telemetry batch failed';
            return items.map(() => ({ type: 'RETRY_LATER', reason }));
        }
    }
}
