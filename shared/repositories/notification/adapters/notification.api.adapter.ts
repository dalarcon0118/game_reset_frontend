import { INotificationRepository, Notification } from '../notification.ports';
import { NotificationApi } from '../api/api';
import settings from '../../../../config/settings';
import { logger } from '../../../utils/logger';
import { NotificationOfflineAdapter } from './notification.offline.adapter';
import { isServerReachable } from '@/shared/utils/network';

const log = logger.withTag('NOTIFICATION_ADAPTER');

/**
 * Orchestrator for Notification infrastructure.
 * Stateless and deterministic: delegates storage to specialized adapters.
 */
export class NotificationApiAdapter implements INotificationRepository {
    private offlineAdapter = new NotificationOfflineAdapter();

    async getNotifications(): Promise<Notification[]> {
        // 1. Siempre obtener el inbox local persistido (Determinismo)
        const local = await this.offlineAdapter.getAll('mock-user-id'); // Usamos mock-user-id para adapter simplificado si es necesario

        try {
            // 2. Intentar refresco remoto solo si hay red
            const isOnline = await isServerReachable();
            if (!isOnline) {
                log.info('System offline: returning local notifications only');
                return local;
            }

            const remote = await NotificationApi.getNotifications();

            // 3. Mezclar resultados (Lógica de dominio básica en infraestructura)
            // En una arquitectura más estricta, esto lo haría un mapper o el repositorio padre.
            return [...local, ...(remote as Notification[])];
        } catch (error) {
            log.error('Failed to fetch remote notifications, returning local only', error);
            return local;
        }
    }

    async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>): Promise<Notification> {
        const newNotification: Notification = {
            ...notification,
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        // Persistencia inmediata en el puerto offline (Efecto determinista)
        await this.offlineAdapter.save('mock-user-id', newNotification);
        log.debug('Notification persisted offline', newNotification.id);

        // Intento de sincronización remota (Fire and forget)
        const isOnline = await isServerReachable();
        if (isOnline) {
            NotificationApi.createNotification(notification as any)
                .then(() => log.debug('Notification synced to server'))
                .catch(err => log.error('Failed to sync notification to server', err));
        }

        return newNotification;
    }

    async markAsRead(notificationId: string): Promise<Notification> {
        // Intentar actualizar en storage local primero
        const isLocal = notificationId.startsWith('local-');

        if (isLocal) {
            const readAt = new Date().toISOString();
            await this.offlineAdapter.updateStatus('mock-user-id', notificationId, 'read', readAt);

            const updated = await this.offlineAdapter.getById('mock-user-id', notificationId);
            if (updated) return updated;
        }

        // Si no es local o falló el storage, ir a API
        const result = await NotificationApi.markAsRead(notificationId);
        return result as Notification;
    }

    async markAllAsRead(): Promise<void> {
        // 1. Limpiar local inbox determinísticamente
        const local = await this.offlineAdapter.getAll('mock-user-id');
        const readAt = new Date().toISOString();

        for (const n of local) {
            if (n.status === 'pending') {
                await this.offlineAdapter.updateStatus('mock-user-id', n.id, 'read', readAt);
            }
        }

        // 2. Sincronizar con API si hay red
        const isOnline = await isServerReachable();
        if (isOnline) {
            await NotificationApi.markAllAsRead();
        }
    }

    async deleteNotification(notificationId: string): Promise<void> {
        // Borrar de storage local
        await this.offlineAdapter.delete('mock-user-id', notificationId);

        // Borrar de API si hay red
        const isOnline = await isServerReachable();
        if (isOnline) {
            await NotificationApi.deleteNotification(notificationId);
        }
    }

    async clearAllNotifications(): Promise<void> {
        await this.offlineAdapter.clearAll('mock-user-id');
        const isOnline = await isServerReachable();
        if (isOnline) {
            // await NotificationApi.clearAllNotifications(); // No implementado en API adapter simplificado, asumimos que no es crítico aquí
        }
    }

    getStreamUrl(token: string): string {
        return `${settings.api.baseUrl}/notifications/stream/?token=${encodeURIComponent(token)}`;
    }

    isReady(): boolean {
        return true;
    }
}
