import { 
    SyncStrategy, 
    SyncQueueItem, 
    SyncOutcome 
} from '@core/offline-storage/types';
import { DlqApiAdapter } from '../adapters/dlq.api.adapter';
import { logger } from '@/shared/utils/logger';
import { DlqItem } from '../dlq.types';

const log = logger.withTag('DLQ_SYNC_STRATEGY');

/**
 * Estrategia para que el SyncWorkerCore pueda procesar items de la DLQ.
 * Reutiliza el ApiAdapter de DLQ para reportar los errores al backend.
 */
export class DlqPushStrategy implements SyncStrategy {
    private api = new DlqApiAdapter();

    async push(item: SyncQueueItem<DlqItem>): Promise<SyncOutcome> {
        try {
            log.info(`Pushing DLQ item to backend: ${item.entityId}`);
            
            if (!item.data) {
                return { type: 'FATAL_ERROR', reason: 'No data found in sync item' };
            }

            await this.api.reportItem(item.data);
            
            return { type: 'SUCCESS' };
        } catch (error: any) {
            log.error(`Failed to push DLQ item ${item.entityId}`, error);
            return { 
                type: 'RETRY_LATER', 
                reason: error.message || 'Unknown error' 
            };
        }
    }

    async pushBatch(items: SyncQueueItem<DlqItem>[]): Promise<SyncOutcome[]> {
        return Promise.all(items.map(item => this.push(item)));
    }
}
