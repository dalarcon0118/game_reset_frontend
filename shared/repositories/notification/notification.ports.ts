export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    status: 'pending' | 'read';
    createdAt: string;
    readAt?: string | null;
    userId?: string | null;
    metadata?: Record<string, any>;
}

export interface INotificationRepository {
    getNotifications(): Promise<Notification[]>;
    markAsRead(notificationId: string): Promise<Notification>;
    markAllAsRead(): Promise<void>;
    deleteNotification(notificationId: string): Promise<void>;
    getStreamUrl(token: string): string;
}
