import { createElmStore } from '@/shared/core/engine';
import { Model } from './model';
import { update, subscriptions } from './update';
import { effectHandlers } from '@/shared/core/effectHandlers';
import { FETCH_NOTIFICATIONS_REQUESTED, ADD_NOTIFICATION } from './msg';
import { Sub } from '@/shared/core/sub';

// Initial model
export const initialNotificationModel: Model = {
    notifications: { type: 'NotAsked' },
    unreadCount: 0,
    preferences: {
        enablePushNotifications: true,
        enableEmailNotifications: false,
        enableInAppNotifications: true,
    },
    selectedNotification: null,
    currentFilter: 'all',
    allNotifications: [],
    authToken: null,
};

// Create the store
export const useNotificationStore = createElmStore<Model, import('./msg').Msg>(
    initialNotificationModel,
    update,
    effectHandlers as any,
    (model) => {
        // SSE Subscription for real-time notifications
        // The URL should point to our new backend endpoint
        const sseUrl = 'http://localhost:8000/api/notifications/stream/';

        const headers: Record<string, string> = {};
        if (model.authToken) {
            headers['Authorization'] = `Bearer ${model.authToken}`;
        }

        const sseSub = Sub.sse(
            sseUrl,
            (event: any) => {
                if (event.type === 'NOTIFICATION_CREATED') {
                    return ADD_NOTIFICATION(event.data);
                }
                return { type: 'NONE' } as any;
            },
            'notification-sse-stream',
            headers
        );

        return Sub.batch([sseSub, subscriptions(model)]);
    }
);

// Initialize the store with initial data
export const initializeNotificationStore = () => {
    useNotificationStore.getState().dispatch(FETCH_NOTIFICATIONS_REQUESTED());
};