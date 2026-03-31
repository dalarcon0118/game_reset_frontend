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
        if (!item.data) {
            return { type: 'FATAL_ERROR', reason: 'No action data found in sync item' };
        }

        const { type, payload } = item.data;

        try {
            switch (type) {
                case 'ADD': {
                    const result = await NotificationApi.createNotification(payload);
                    return { type: 'SUCCESS', backendId: result.id };
                }
                case 'MARK_READ': {
                    const notificationId = typeof payload === 'string' ? payload : payload.id;
                    // Si el ID es local, debemos reintentar más tarde cuando se haya ascendido el ID
                    if (notificationId.startsWith('local-')) {
                        return { type: 'RETRY_LATER', reason: 'Waiting for ID upgrade' };
                    }
                    await NotificationApi.markAsRead(notificationId);
                    break;
                }
                case 'MARK_ALL_READ':
                    await NotificationApi.markAllAsRead();
                    break;
                case 'DELETE': {
                    const notificationId = typeof payload === 'string' ? payload : payload.id;
                    if (notificationId.startsWith('local-')) {
                        // Si es local y se borra, simplemente lo damos por exitoso para limpiar la cola
                        return { type: 'SUCCESS' };
                    }
                    await NotificationApi.deleteNotification(notificationId);
                    break;
                }
                default:
                    log.warn(`Unknown sync action type: ${type}`);
                    return { type: 'FATAL_ERROR', reason: `Unknown action: ${type}` };
            }

            return { type: 'SUCCESS' };
        } catch (error: any) {
            const status = error.status || error.response?.status;
            const reason = error.data?.detail || error.message || `HTTP ${status}`;

            log.error(`Sync failed for action ${type}:`, reason);

            // Si es un error de red o servidor temporal, reintentamos más tarde
            if (!status || status >= 500 || status === 429) {
                return { type: 'RETRY_LATER', reason };
            }

            // Errores de cliente (400, 404, etc) se consideran fatales para no bloquear la cola
            return { type: 'FATAL_ERROR', reason };
        }
    }
}
