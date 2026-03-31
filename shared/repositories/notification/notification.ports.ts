export interface Notification {
    id: string;
    clientId?: string; // ID único generado en el cliente para reconciliación
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    status: 'pending' | 'read';
    createdAt: string;
    updatedAt: string; // Timestamp de la última modificación local
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
