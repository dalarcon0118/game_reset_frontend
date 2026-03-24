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
    addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>): Promise<Notification>;
    markAsRead(notificationId: string): Promise<Notification>;
    markAllAsRead(): Promise<void>;
    deleteNotification(notificationId: string): Promise<void>;
    getStreamUrl(token: string): string;
    isReady(): boolean;
}
