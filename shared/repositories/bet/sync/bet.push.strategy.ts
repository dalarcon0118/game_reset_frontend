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
        return this.pushBatch([item]).then(results => results[0]);
    }

    async pushBatch(items: SyncQueueItem[]): Promise<SyncOutcome[]> {
        if (items.length === 0) return [];

        try {
            log.info(`Pushing bet batch sync: ${items.length} items`);

            // Agrupar por drawId para optimizar si fuera necesario, 
            // pero el backend actual procesa cada CreateBetDTO de forma independiente.
            // Para simplicidad y robustez, procesamos cada item del batch.
            // Si el backend tuviera un endpoint de "bulk create bets", lo usaríamos aquí.

            const results = await Promise.all(items.map(async (item): Promise<SyncOutcome> => {
                try {
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
                    const reason = error.data?.detail || error.data?.message || error.message || `HTTP ${status || 'Unknown Error'}`;

                    log.error(`[SYNC_ERROR] Bet ${item.entityId} sync failed:`, reason);

                    // MODO MANUAL PURO: Cualquier error se considera FATAL para detener reintentos automáticos
                    // y permitir que el usuario decida cuándo reintentar desde la UI.
                    return {
                        type: 'FATAL_ERROR',
                        reason
                    };
                }
            }));

            return results;
        } catch (error: any) {
            log.error('General error in bet batch push', error);
            // MODO MANUAL PURO: Cualquier error se considera FATAL para detener reintentos automáticos
            return items.map(() => ({ type: 'FATAL_ERROR', reason: error.message }));
        }
    }
}
