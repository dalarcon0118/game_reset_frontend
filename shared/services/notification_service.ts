import { NotificationApi } from './notification/api';
import { BackendNotification } from './notification/types';

export type { BackendNotification as Notification };

export class NotificationService {
    static async getNotifications(): Promise<BackendNotification[]> {
        return await NotificationApi.getNotifications();
    }

    static async markAsRead(notificationId: string): Promise<BackendNotification> {
        return await NotificationApi.markAsRead(notificationId);
    }

    static async markAllAsRead(): Promise<any> {
        return await NotificationApi.markAllAsRead();
    }

    static async createNotification(notification: Omit<BackendNotification, 'id' | 'createdAt'>): Promise<BackendNotification> {
        return await NotificationApi.createNotification(notification);
    }

    static async deleteNotification(notificationId: string): Promise<any> {
        return await NotificationApi.deleteNotification(notificationId);
    }
}
