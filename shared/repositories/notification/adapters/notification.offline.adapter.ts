import { Notification } from '../notification.ports';
import { offlineStorage } from '@core/offline-storage/instance';
import { logger } from '@/shared/utils/logger';
import { NotificationOfflineKeys } from '../NotificationOfflineKeys';
import { SyncAdapter } from '@core/offline-storage/sync/adapter';

const log = logger.withTag('NotificationOfflineAdapter');


/**
 * Adaptador de almacenamiento offline para Notificaciones.
 * Implementación determinista y multi-tenant.
 */
export class NotificationOfflineAdapter {

    /**
     * Guarda una notificación individual para un usuario.
     */
    async save(userId: string, notification: Notification): Promise<void> {
        const key = NotificationOfflineKeys.notification(userId, notification.id);
        await offlineStorage.set(key, notification);
        log.debug(`Notification saved offline for user ${userId}: ${notification.id}`);
    }

    /**
     * Guarda un lote de notificaciones para un usuario.
     */
    async saveBatch(userId: string, notifications: Notification[]): Promise<void> {
        const entries = notifications.map(n => ({
            key: NotificationOfflineKeys.notification(userId, n.id),
            data: n
        }));
        await offlineStorage.setMulti(entries);
        log.debug(`Saved ${notifications.length} notifications offline for user ${userId}`);
    }

    /**
     * Obtiene todas las notificaciones del inbox de un usuario, ordenadas por fecha.
     */
    async getAll(userId: string): Promise<Notification[]> {
        const pattern = NotificationOfflineKeys.getPattern(userId);
        const results = await offlineStorage.query<Notification>(pattern).all();

        // Orden determinista por fecha de creación (descendente)
        return results.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    /**
     * Obtiene una notificación específica de un usuario por su ID.
     */
    async getById(userId: string, id: string): Promise<Notification | null> {
        const key = NotificationOfflineKeys.notification(userId, id);
        return await offlineStorage.get<Notification>(key);
    }

    /**
     * Borra una notificación del storage de un usuario.
     */
    async delete(userId: string, id: string): Promise<void> {
        const key = NotificationOfflineKeys.notification(userId, id);
        await offlineStorage.remove(key);
        log.debug(`Notification removed offline for user ${userId}: ${id}`);
    }

    /**
     * Actualiza el estado de lectura de una notificación para un usuario.
     */
    async updateStatus(userId: string, id: string, status: 'read' | 'pending', readAt?: string): Promise<void> {
        const key = NotificationOfflineKeys.notification(userId, id);
        const notification = await offlineStorage.get<Notification>(key);

        if (notification) {
            const now = new Date().toISOString();
            await offlineStorage.set(key, {
                ...notification,
                status,
                readAt: status === 'read' ? (readAt || now) : null,
                updatedAt: now // Siempre actualizar el timestamp de modificación
            });
            log.debug(`Notification status updated offline for user ${userId}: ${id} -> ${status}`);
        } else {
            log.warn(`Attempted to update non-existent notification for user ${userId}: ${id}`);
        }
    }

    /**
     * Limpia todo el inbox local de un usuario.
     */
    async clearAll(userId: string): Promise<void> {
        const pattern = NotificationOfflineKeys.getPattern(userId);
        const results = await offlineStorage.query<Notification>(pattern).all();
        const keys = results.map(n => NotificationOfflineKeys.notification(userId, n.id));

        if (keys.length > 0) {
            await offlineStorage.removeMulti(keys);
        }
        log.info(`Local notification inbox cleared for user ${userId}`);
    }

    /**
     * 🪦 TOMBSTONES: Marca una notificación como eliminada localmente.
     */
    async markAsDeleted(userId: string, id: string): Promise<void> {
        const key = NotificationOfflineKeys.tombstone(userId, id);
        await offlineStorage.set(key, { id, deletedAt: new Date().toISOString() });
    }

    /**
     * Verifica si existe un tombstone para un ID.
     */
    async isDeleted(userId: string, id: string): Promise<boolean> {
        const key = NotificationOfflineKeys.tombstone(userId, id);
        const tombstone = await offlineStorage.get(key);
        return !!tombstone;
    }

    /**
     * 📥 SYNC QUEUE: Encola una acción de sincronización en la cola global.
     */
    async enqueueAction(userId: string, action: { type: string, payload: any }): Promise<string> {
        log.debug(`Enqueuing notification action to global sync queue: ${action.type}`, { userId });

        return await SyncAdapter.addToQueue({
            type: 'notification',
            entityId: action.payload || 'global', // Usar el payload ID o marcador global
            priority: 2, // Prioridad media-alta para notificaciones
            status: 'pending',
            attempts: 0,
            data: {
                ...action,
                userId // Importante para multi-tenancy durante la sincronización
            }
        });
    }

    /**
     * @deprecated Las acciones se gestionan vía SyncWorker global
     */
    async getPendingActions(userId: string): Promise<any[]> {
        log.warn('getPendingActions is deprecated and returns empty array');
        return [];
    }

    /**
     * @deprecated Las acciones se gestionan vía SyncWorker global
     */
    async dequeueAction(userId: string, actionId: string): Promise<void> {
        log.warn('dequeueAction is deprecated and does nothing');
    }
}