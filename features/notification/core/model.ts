import { WebData } from '@/shared/core/remote.data';

export interface AppNotification {
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

export interface NotificationPreferences {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableInAppNotifications: boolean;
}

export interface Model {
    notifications: WebData<AppNotification[]>;
    unreadCount: number;
    preferences: NotificationPreferences;
    selectedNotification: AppNotification | null;
    currentFilter: 'all' | 'pending' | 'read';
    allNotifications: AppNotification[];
    authToken: string | null;
    currentUser: any | null;
}
