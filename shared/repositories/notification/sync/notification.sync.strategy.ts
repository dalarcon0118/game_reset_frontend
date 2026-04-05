import {
    SyncStrategy,
    SyncQueueItem,
    SyncOutcome
} from '@core/offline-storage/types';
import { NotificationApi } from '../api/api';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('NOTIFICATION_SYNC_STRATEGY');

/**
 * 🛰️ Estrategia de sincronización para Notificaciones.
 * Procesa acciones encoladas (ADD, MARK_READ, DELETE) de forma secuencial.
 */
export class NotificationSyncStrategy implements SyncStrategy {

    async push(item: SyncQueueItem): Promise<SyncOutcome> {
        log.info(`[SYNC-DIAGNOSTIC] Processing item: ${item.id}, type: ${item.type}, action: ${item.data?.type}`);
        
        if (!item.data) {
            log.error(`[SYNC-DIAGNOSTIC] Item ${item.id} has no data`);
            return { type: 'FATAL_ERROR', reason: 'No action data found in sync item' };
        }

        const { type, payload } = item.data;

        try {
            switch (type) {
                case 'ADD': {
                    log.debug(`[SYNC-DIAGNOSTIC] ADD notification: ${JSON.stringify(payload)}`);
                    const result = await NotificationApi.createNotification(payload);
                    log.info(`[SYNC-DIAGNOSTIC] ADD success: backendId=${result.id}`);
                    return { type: 'SUCCESS', backendId: result.id };
                }
                case 'MARK_READ': {
                    const notificationId = typeof payload === 'string' ? payload : payload.id;
                    log.debug(`[SYNC-DIAGNOSTIC] MARK_READ: ${notificationId}`);
                    // Si el ID es local, debemos reintentar más tarde cuando se haya ascendido el ID
                    if (notificationId.startsWith('local-')) {
                        log.warn(`[SYNC-DIAGNOSTIC] MARK_READ deferred: local ID detected (${notificationId})`);
                        return { type: 'RETRY_LATER', reason: 'Waiting for ID upgrade' };
                    }
                    await NotificationApi.markAsRead(notificationId);
                    log.info(`[SYNC-DIAGNOSTIC] MARK_READ success: ${notificationId}`);
                    break;
                }
                case 'MARK_ALL_READ':
                    log.debug('[SYNC-DIAGNOSTIC] MARK_ALL_READ');
                    await NotificationApi.markAllAsRead();
                    log.info('[SYNC-DIAGNOSTIC] MARK_ALL_READ success');
                    break;
                case 'CLEAR_ALL':
                    log.debug('[SYNC-DIAGNOSTIC] CLEAR_ALL');
                    await NotificationApi.clearAll();
                    log.info('[SYNC-DIAGNOSTIC] CLEAR_ALL success');
                    break;
                case 'DELETE': {
                    const notificationId = typeof payload === 'string' ? payload : payload.id;
                    log.debug(`[SYNC-DIAGNOSTIC] DELETE: ${notificationId}`);
                    if (notificationId.startsWith('local-')) {
                        log.info(`[SYNC-DIAGNOSTIC] DELETE local item success (cleanup only): ${notificationId}`);
                        return { type: 'SUCCESS' };
                    }
                    await NotificationApi.deleteNotification(notificationId);
                    log.info(`[SYNC-DIAGNOSTIC] DELETE success: ${notificationId}`);
                    break;
                }
                default:
                    log.warn(`[SYNC-DIAGNOSTIC] Unknown sync action type: ${type}`);
                    return { type: 'FATAL_ERROR', reason: `Unknown action: ${type}` };
            }

            return { type: 'SUCCESS' };
        } catch (error: any) {
            const status = error.status || error.response?.status;
            const reason = error.data?.detail || error.message || `HTTP ${status}`;

            log.error(`[SYNC-DIAGNOSTIC] Sync failed for action ${type}: status=${status}, reason=${reason}`, error);

            // Si es un error de red o servidor temporal, reintentamos más tarde
            if (!status || status >= 500 || status === 429) {
                return { type: 'RETRY_LATER', reason };
            }

            // Errores de cliente (400, 404, etc) se consideran fatales para no bloquear la cola
            return { type: 'FATAL_ERROR', reason };
        }
    }
}
