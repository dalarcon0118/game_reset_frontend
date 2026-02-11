export interface BackendNotification {
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

export type Notification = BackendNotification;
