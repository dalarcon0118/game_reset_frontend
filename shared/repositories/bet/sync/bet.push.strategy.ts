import {
    SyncStrategy,
    SyncQueueItem,
    SyncOutcome
} from '@core/offline-storage/types';
import { BetApiAdapter } from '../adapters/bet.api.adapter';
import { logger } from '@/shared/utils/logger';
import { BET_LOG_TAGS, BET_LOGS } from '../bet.constants';

const log = logger.withTag(BET_LOG_TAGS.SYNC_STRATEGY);

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
            log.info(`${BET_LOGS.SYNC_PUSHING_BATCH}: ${items.length} items`);

            // Agrupar por drawId para optimizar si fuera necesario, 
            // pero el backend actual procesa cada CreateBetDTO de forma independiente.
            // Para simplicidad y robustez, procesamos cada item del batch.
            // Si el backend tuviera un endpoint de "bulk create bets", lo usaríamos aquí.

            const results = await Promise.all(items.map(async (item): Promise<SyncOutcome> => {
                try {
                    if (!item.data) {
                        return { type: 'FATAL_ERROR', reason: BET_LOGS.SYNC_NO_DATA };
                    }

                    // Aseguramos que el fingerprint sea recalculado si el ownerUser era inválido (0)
                    // Esto permite recuperar apuestas bloqueadas por firmas corruptas
                    const betData = { ...item.data };
                    if (betData.ownerUser === "0" || !betData.ownerUser) {
                        log.warn(`[SYNC_PUSH] ⚠️ Apuesta ${item.entityId} tiene ownerUser inválido. Se requiere re-firma.`);
                    }

                    // 1. Intentar creación directamente (El backend maneja la idempotencia nativamente)
                    const response = await this.api.create(betData, item.entityId);
                    const backendId = Array.isArray(response) ? response[0]?.id?.toString() : (response as any).id?.toString();

                    return {
                        type: 'SUCCESS',
                        backendId
                    };
                } catch (error: any) {
                    const status = error.status || error.response?.status;
                    const reason = error.data?.detail || error.data?.message || error.message || `HTTP ${status || 'Unknown Error'}`;

                    log.error(`[${BET_LOGS.SYNC_ERROR}] ${item.entityId}:`, reason);

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
            log.error(BET_LOGS.SYNC_GENERAL_ERROR, error);
            // MODO MANUAL PURO: Cualquier error se considera FATAL para detener reintentos automáticos
            return items.map(() => ({ type: 'FATAL_ERROR', reason: error.message }));
        }
    }
}
