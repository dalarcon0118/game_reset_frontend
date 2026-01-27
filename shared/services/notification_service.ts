import apiClient from './api_client';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    status: 'pending' | 'read';
    createdAt: string;
    readAt?: string;
    userId?: string;
    metadata?: Record<string, any>;
}

export class NotificationService {
    static getNotifications(): Promise<Notification[]> {
        return apiClient.get('/notifications/');
    }

    static markAsRead(notificationId: string): Promise<Notification> {
        return apiClient.patch(`/notifications/${notificationId}/`, { status: 'read' });
    }

    static markAllAsRead(): Promise<any> {
        return apiClient.post('/notifications/mark-all-read/', {});
    }

    static createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
        return apiClient.post('/notifications/', notification, {});
    }

    static deleteNotification(notificationId: string): Promise<any> {
        return apiClient.delete(`/notifications/${notificationId}/`, {});
    }
}