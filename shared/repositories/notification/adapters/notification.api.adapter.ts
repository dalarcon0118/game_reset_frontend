import { INotificationRepository, Notification } from '../notification.ports';
import { NotificationApi } from '../api/api';
import settings from '../../../../config/settings';
import { logger } from '../../../utils/logger';

const log = logger.withTag('NOTIFICATION_ADAPTER');

export class NotificationApiAdapter implements INotificationRepository {
    private localNotifications: Notification[] = [];

    async getNotifications(): Promise<Notification[]> {
        try {
            const remote = await NotificationApi.getNotifications();
            // Merge local and remote
            return [...this.localNotifications, ...(remote as Notification[])];
        } catch (error) {
            log.error('Failed to fetch remote notifications, returning local only', error);
            return this.localNotifications;
        }
    }

    async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>): Promise<Notification> {
        const newNotification: Notification = {
            ...notification,
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        // Store locally
        this.localNotifications.unshift(newNotification);
        log.debug('Notification added locally', newNotification);

        // Try to send to server (fire and forget for now, but in production we'd want to sync)
        NotificationApi.createNotification(notification as any)
            .then(() => log.debug('Notification synced to server'))
            .catch(err => log.error('Failed to sync notification to server', err));

        return newNotification;
    }

    async markAsRead(notificationId: string): Promise<Notification> {
        // Handle local notifications
        const localIdx = this.localNotifications.findIndex(n => n.id === notificationId);
        if (localIdx !== -1) {
            this.localNotifications[localIdx] = {
                ...this.localNotifications[localIdx],
                status: 'read',
                readAt: new Date().toISOString()
            };
            return this.localNotifications[localIdx];
        }

        const result = await NotificationApi.markAsRead(notificationId);
        return result as Notification;
    }

    async markAllAsRead(): Promise<void> {
        this.localNotifications = this.localNotifications.map(n => ({
            ...n,
            status: 'read',
            readAt: new Date().toISOString()
        }));
        await NotificationApi.markAllAsRead();
    }

    async deleteNotification(notificationId: string): Promise<void> {
        this.localNotifications = this.localNotifications.filter(n => n.id !== notificationId);
        await NotificationApi.deleteNotification(notificationId);
    }

    getStreamUrl(token: string): string {
        return `${settings.api.baseUrl}/notifications/stream/?token=${encodeURIComponent(token)}`;
    }

    isReady(): boolean {
        return true; // Simple readiness check
    }
}
