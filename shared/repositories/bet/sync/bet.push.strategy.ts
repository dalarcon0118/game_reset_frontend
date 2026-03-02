import { 
    SyncStrategy, 
    SyncQueueItem, 
    SyncOutcome 
} from '@/shared/core/offline-storage/types';
import { BetApiAdapter } from '../adapters/bet.api.adapter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BET_SYNC_STRATEGY');

/**
 * Estrategia de sincronización PUSH para Apuestas.
 * Se encarga de enviar apuestas pendientes al servidor con manejo de idempotencia.
 */
export class BetPushStrategy implements SyncStrategy {
    private api = new BetApiAdapter();

    async push(item: SyncQueueItem): Promise<SyncOutcome> {
        try {
            log.info(`Pushing bet sync item: ${item.entityId}`, { attempts: item.attempts });
            
            // 1. Verificar si ya existe en el servidor (idempotencia)
            const status = await this.api.checkStatus(item.entityId);
            if (status.synced && status.bets) {
                log.info(`Bet ${item.entityId} already synced on server.`);
                return { 
                    type: 'SUCCESS', 
                    backendId: Array.isArray(status.bets) ? status.bets[0]?.id?.toString() : (status.bets as any).id?.toString() 
                };
            }

            // 2. Intentar creación
            if (!item.data) {
                return { type: 'FATAL_ERROR', reason: 'No data found in sync item' };
            }

            const response = await this.api.create(item.data, item.entityId);
            const backendId = Array.isArray(response) ? response[0]?.id?.toString() : (response as any).id?.toString();

            return { 
                type: 'SUCCESS', 
                backendId 
            };

        } catch (error: any) {
            const status = error.status || error.response?.status;
            
            // Errores de cliente (400-499) son fatales si no son transitorios
            if (status >= 400 && status < 500 && status !== 429 && status !== 408) {
                log.error(`Fatal error syncing bet ${item.entityId}`, error);
                return { 
                    type: 'FATAL_ERROR', 
                    reason: error.data?.detail || error.message || `HTTP ${status}` 
                };
            }

            // Reintentar para errores de red o servidor
            return { type: 'RETRY_LATER', reason: error.message };
        }
    }
}
