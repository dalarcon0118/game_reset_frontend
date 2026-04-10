export interface Notification {
    id: string;
    clientId?: string;
    externalKey?: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    status: 'pending' | 'read';
    createdAt: string;
    updatedAt: string;
    readAt?: string | null;
    userId?: string | null;
    metadata?: Record<string, any>;
}

export interface INotificationRepository {
    getNotifications(): Promise<Notification[]>;
    addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status' | 'updatedAt'>, externalKey?: string): Promise<Notification>;
    markAsRead(notificationId: string): Promise<Notification>;
    markAllAsRead(): Promise<void>;
    deleteNotification(notificationId: string): Promise<void>;
    clearAllNotifications(): Promise<void>;
    forceSyncFromBackend(): Promise<Notification[]>;
    getStreamUrl(token: string): string;
    isReady(): boolean;
}
