import { INotificationRepository, Notification } from '../notification.ports';
import { NotificationApi } from '../api/api';
import settings from '../../../../config/settings';

export class NotificationApiAdapter implements INotificationRepository {
    async getNotifications(): Promise<Notification[]> {
        const result = await NotificationApi.getNotifications();
        return result as Notification[];
    }

    async markAsRead(notificationId: string): Promise<Notification> {
        const result = await NotificationApi.markAsRead(notificationId);
        return result as Notification;
    }

    async markAllAsRead(): Promise<void> {
        await NotificationApi.markAllAsRead();
    }

    async deleteNotification(notificationId: string): Promise<void> {
        await NotificationApi.deleteNotification(notificationId);
    }

    getStreamUrl(token: string): string {
        return `${settings.api.baseUrl}/notifications/stream/?token=${encodeURIComponent(token)}`;
    }
}
