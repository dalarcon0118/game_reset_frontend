import { offlineEventBus } from '@/shared/core/offline-storage/instance';
import { IBetStorage } from '../bet.types';
import { logger } from '@/shared/utils/logger';
import { DomainEvent } from '@core/offline-storage/types';
import { Task } from '@/shared/core';
import { INotificationRepository } from '@/shared/repositories/notification/notification.ports';
import { BET_LOGS } from '../bet.constants';

const log = logger.withTag('BetSyncListener');

/**
 * Escucha eventos de sincronización para actualizar el modelo de dominio de Apuestas.
 * Refactorizado a variante funcional usando Task para orquestar efectos.
 */
export class BetSyncListener {
    private unsubscribe?: () => void;
    private static notifiedSuccessKeys = new Map<string, number>();
    private static readonly SUCCESS_NOTIFICATION_TTL_MS = 10 * 60 * 1000;

    constructor(
        private readonly storage: IBetStorage,
        private readonly notificationRepository: INotificationRepository
    ) { }

    /**
     * Inicia la escucha de eventos del bus
     */
    start(): void {
        if (this.unsubscribe) return;

        this.unsubscribe = offlineEventBus.subscribe((event: DomainEvent) => {
            if (event.type === 'SYNC_ITEM_ERROR' && event.entity === 'bet') {
                this.handleSyncError(event.payload).fork();
            }

            if (event.type === 'SYNC_ITEM_SUCCESS' && event.entity === 'bet') {
                this.handleSyncSuccess(event.payload).fork();
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
     * Maneja errores de sincronización (Variante Pura)
     */
    private handleSyncError(payload: {
        entityId: string;
        error: string;
        isFatal: boolean;
        attempts: number
    }): Task<Error, void> {
        const { entityId, error, isFatal, attempts } = payload;
        const status = isFatal ? 'error' : 'pending';

        return Task.fromPromise(() => this.storage.updateStatus(entityId, status, {
            syncContext: {
                lastAttempt: Date.now(),
                attemptsCount: attempts,
                lastError: error,
                errorType: isFatal ? 'FATAL' : 'RETRYABLE'
            }
        }))
            .tap(() => log.info(`[BET-SYNC-FLOW] Estado de apuesta ${entityId} actualizado a: ${status}`))
            .tapError(e => log.error(`[BET-SYNC-FLOW] ERROR al actualizar syncContext para apuesta ${entityId}`, e));
    }

    /**
     * Evalúa si un timestamp corresponde a un día estrictamente anterior al actual.
     * Función pura (dependencias inyectables o puras por firma).
     */
    private isFromPreviousDay(timestamp: number, now: number = Date.now()): boolean {
        const betDate = new Date(timestamp);
        const today = new Date(now);

        betDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return betDate.getTime() < today.getTime();
    }

    private shouldNotifySuccess(receiptCode?: string, backendId?: string): boolean {
        const identity = receiptCode || backendId;
        if (!identity) return true;

        const key = `bet-sync-success:${identity}`;
        const now = Date.now();
        const previous = BetSyncListener.notifiedSuccessKeys.get(key);

        if (previous && now - previous < BetSyncListener.SUCCESS_NOTIFICATION_TTL_MS) {
            return false;
        }

        BetSyncListener.notifiedSuccessKeys.set(key, now);
        return true;
    }

    /**
     * Maneja el éxito de sincronización (Variante Pura)
     */
    private handleSyncSuccess(payload: { entityId: string; backendId?: string }): Task<Error, void> {
        const { entityId, backendId } = payload;

        return Task.fromPromise(() => this.storage.getAll())
            .map(allBets => allBets.find(b => b.id === entityId || b.externalId === entityId))
            .andThen(bet => {
                if (bet && bet.timestamp && this.isFromPreviousDay(bet.timestamp)) {
                    // Ruta 1: Eliminar si es de un día anterior
                    return Task.fromPromise(() => this.storage.delete(entityId))
                        .tap(() => log.info(`[BET-SYNC-FLOW] Apuesta ${entityId} es de un día anterior. Eliminando...`));
                }

                // Ruta 2: Actualizar si es del día actual
                return Task.fromPromise(() => this.storage.updateStatus(entityId, 'synced', {
                    backendId,
                    syncContext: { lastAttempt: Date.now(), syncedAt: Date.now(), attemptsCount: 0 }
                }))
                    .tap(() => log.info(`[BET-SYNC-FLOW] Estado de apuesta ${entityId} actualizado a: synced`))
                    .tap(() => {
                        // Notificar éxito de sincronización
                        if (!bet || !bet.receiptCode) {
                            return;
                        }
                        if (this.shouldNotifySuccess(bet.receiptCode, backendId)) {
                            log.info(`[BET-NOTIFICATION] Creando notificación de éxito para apuesta ${bet.receiptCode}`);
                            const externalKey = `bet-synced:${bet.receiptCode}`;
                            this.notificationRepository.addNotification({
                                title: BET_LOGS.NOTIF_SYNC_SUCCESS_TITLE,
                                message: BET_LOGS.NOTIF_SYNC_SINGLE_SUCCESS_MSG(bet.receiptCode),
                                type: 'success',
                                metadata: {
                                    receiptCode: bet.receiptCode,
                                    drawId: bet.drawId,
                                    backendId: backendId
                                }
                            }, externalKey)
                                .then(() => log.info(`[BET-NOTIFICATION] ✅ Notificación de éxito creada para ${bet.receiptCode}`))
                                .catch(e => log.warn(`[BET-NOTIFICATION] ❌ Failed to create success notification for ${bet.receiptCode}`, e));
                            return;
                        }
                        log.debug(`[BET-NOTIFICATION] Notificación duplicada omitida para ${bet.receiptCode}`);
                    });
            })
            .tapError(e => log.error(`[BET-SYNC-FLOW] Error en handleSyncSuccess para apuesta ${entityId}`, e));
    }
}
