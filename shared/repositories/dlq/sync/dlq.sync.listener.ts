import { offlineEventBus } from '@/shared/core/offline-storage/instance';
import { IDlqStorage } from '../dlq.ports';
import { logger } from '@/shared/utils/logger';
import { DomainEvent } from '@core/offline-storage/types';

const log = logger.withTag('DlqSyncListener');

/**
 * Escucha eventos de sincronización para actualizar el estado de los ítems en la DLQ.
 * Cuando un ítem de la DLQ se sincroniza con éxito, lo marca como 'reconciled'.
 */
export class DlqSyncListener {
    private unsubscribe?: () => void;

    constructor(
        private readonly storage: IDlqStorage,
        private readonly onSuccess?: (entityId: string) => Promise<void>
    ) { }

    /**
     * Inicia la escucha de eventos del bus
     */
    start(): void {
        if (this.unsubscribe) return;

        this.unsubscribe = offlineEventBus.subscribe((event: DomainEvent) => {
            // Solo nos interesan los éxitos para la DLQ (para marcar como reconciliado)
            if (event.type === 'SYNC_ITEM_SUCCESS' && event.entity === 'dlq') {
                this.handleSyncSuccess(event.payload);
            }
        });

        log.info('DlqSyncListener started and subscribed to offlineEventBus');
    }

    /**
     * Detiene la escucha
     */
    stop(): void {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
        log.info('DlqSyncListener stopped');
    }

    /**
     * Maneja el éxito de sincronización marcando el ítem como reconciliado.
     */
    private async handleSyncSuccess(payload: { entityId: string; backendId?: string }): Promise<void> {
        const { entityId } = payload;
        try {
            log.info(`[DLQ-SYNC] 1. Recibido éxito de sincronización para item: ${entityId}`);

            if (this.onSuccess) {
                await this.onSuccess(entityId);
            } else {
                await this.storage.updateStatus(entityId, 'reconciled');
                log.info(`[DLQ-SYNC] 2. Item ${entityId} marcado como "reconciled" en storage (fallback).`);
            }
        } catch (e) {
            log.error(`[DLQ-SYNC] ERROR al procesar éxito de sync para item ${entityId}`, e);
        }
    }
}
