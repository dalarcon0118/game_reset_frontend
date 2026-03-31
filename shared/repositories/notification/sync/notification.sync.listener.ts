import { offlineEventBus } from '@/shared/core/offline-storage/instance';
import { logger } from '@/shared/utils/logger';
import { DomainEvent } from '@core/offline-storage/types';
import { NotificationOfflineAdapter } from '../adapters/notification.offline.adapter';

const log = logger.withTag('NotificationSyncListener');

/**
 * Escucha eventos de sincronización para actualizar el modelo de dominio de Notificaciones.
 * Maneja el "ID Upgrade" cuando una notificación creada offline se sincroniza con éxito.
 */
export class NotificationSyncListener {
    private unsubscribe?: () => void;
    private offlineAdapter = new NotificationOfflineAdapter();

    /**
     * Inicia la escucha de eventos del bus
     */
    start(): void {
        if (this.unsubscribe) return;

        this.unsubscribe = offlineEventBus.subscribe((event: DomainEvent) => {
            // Manejar éxito de sincronización para entidades de tipo 'notification'
            if (event.type === 'SYNC_ITEM_SUCCESS' && event.entity === 'notification') {
                this.handleSyncSuccess(event.payload);
            }
        });

        log.info('NotificationSyncListener started and subscribed to offlineEventBus');
    }

    /**
     * Detiene la escucha
     */
    stop(): void {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
        log.info('NotificationSyncListener stopped');
    }

    /**
     * Maneja el éxito de sincronización realizando el "ID Upgrade".
     */
    private async handleSyncSuccess(payload: { entityId: string; backendId?: string }): Promise<void> {
        const { entityId, backendId } = payload;

        if (!backendId || !entityId.startsWith('local-')) return;

        try {
            log.info(`[NOTIFICATION-SYNC] Upgrading ID: ${entityId} -> ${backendId}`);

            // 1. El SyncWorker ya eliminó el item de la cola global.
            // 2. Necesitamos actualizar la entidad en el storage local de notificaciones.
            // El SyncRemoteToLocal del Repositorio se encargará de la reconciliación fina,
            // pero este listener ayuda a la reactividad inmediata si fuera necesario.
        } catch (e) {
            log.error(`[NOTIFICATION-SYNC] Error handling sync success for ${entityId}`, e);
        }
    }
}
