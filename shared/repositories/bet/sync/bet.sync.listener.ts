import { offlineEventBus } from '@core/offline-storage/event_bus';
import { IBetStorage } from '../bet.ports';
import { logger } from '@/shared/utils/logger';
import { DomainEvent } from '@core/offline-storage/types';

const log = logger.withTag('BetSyncListener');

/**
 * Escucha eventos de sincronización para actualizar el modelo de dominio de Apuestas.
 * Esto asegura que el syncContext se persista en la entidad Bet en el almacenamiento offline.
 * 
 * Implementa el patrón de "Domain Event Listener" para desacoplar el motor de sync 
 * de la persistencia específica de dominio.
 */
export class BetSyncListener {
    private unsubscribe?: () => void;

    constructor(private readonly storage: IBetStorage) { }

    /**
     * Inicia la escucha de eventos del bus
     */
    start(): void {
        if (this.unsubscribe) return;

        this.unsubscribe = offlineEventBus.subscribe((event: DomainEvent) => {
            // Filtrar eventos de error para entidades de tipo 'bet'
            if (event.type === 'SYNC_ITEM_ERROR' && event.entity === 'bet') {
                this.handleSyncError(event.payload);
            }

            // Limpiar o actualizar en caso de éxito
            if (event.type === 'SYNC_ITEM_SUCCESS' && event.entity === 'bet') {
                this.handleSyncSuccess(event.payload);
            }
        });

        log.info('BetSyncListener started and subscribed to offlineEventBus');
    }

    /**
     * Detiene la escucha
     */
    stop(): void {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
        log.info('BetSyncListener stopped');
    }

    /**
     * Maneja errores de sincronización actualizando el syncContext de la apuesta.
     */
    private async handleSyncError(payload: {
        entityId: string;
        error: string;
        isFatal: boolean;
        attempts: number
    }): Promise<void> {
        const { entityId, error, isFatal, attempts } = payload;

        try {
            log.debug(`Updating syncContext for bet ${entityId} after error (Fatal: ${isFatal})`);

            // Actualizamos la apuesta en el almacenamiento local con el nuevo contexto
            // Usamos 'error' si es fatal o 'pending' si es reintentable
            await this.storage.updateStatus(entityId, isFatal ? 'error' : 'pending', {
                syncContext: {
                    lastAttempt: Date.now(),
                    attemptsCount: attempts,
                    lastError: error,
                    errorType: isFatal ? 'FATAL' : 'RETRYABLE'
                }
            });
        } catch (e) {
            log.error(`Failed to update syncContext for bet ${entityId}`, e);
        }
    }

    /**
     * Maneja el éxito de sincronización.
     */
    private async handleSyncSuccess(payload: { entityId: string; backendId?: string }): Promise<void> {
        const { entityId } = payload;
        try {
            log.debug(`Bet ${entityId} synced successfully, syncContext handled by success flow`);
        } catch (e) {
            log.error(`Error in handleSyncSuccess for bet ${entityId}`, e);
        }
    }
}
