import apiClient from '../../../services/api_client';
import { BackendNotification } from '../types/types';
import { BackendNotificationCodec, BackendNotificationArrayCodec, decodeOrFallback } from '../codecs/codecs';

export const NotificationApi = {
    getNotifications: async (): Promise<BackendNotification[]> => {
        const response = await apiClient.get<BackendNotification[]>('/notifications/');
        return decodeOrFallback(BackendNotificationArrayCodec, response, 'getNotifications');
    },

    markAsRead: async (notificationId: string): Promise<BackendNotification> => {
        const response = await apiClient.patch<BackendNotification>(`/notifications/${notificationId}/`, { status: 'read' });
        return decodeOrFallback(BackendNotificationCodec, response, 'markAsRead');
    },

    markAllAsRead: async (): Promise<any> => {
        return await apiClient.post('/notifications/mark-all-read/', {});
    },

    createNotification: async (notification: Omit<BackendNotification, 'id' | 'createdAt'>): Promise<BackendNotification> => {
        const response = await apiClient.post<BackendNotification>('/notifications/', notification, {});
        return decodeOrFallback(BackendNotificationCodec, response, 'createNotification');
    },

    deleteNotification: async (notificationId: string): Promise<any> => {
        return await apiClient.delete(`/notifications/${notificationId}/`, {});
    },

    clearAll: async (): Promise<any> => {
        return await apiClient.delete('/notifications/clear/', {});
    }
};
