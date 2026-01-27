import { createElmStore } from '@/shared/core/engine';
import { Model } from './model';
import { update, subscriptions } from './update';
import { effectHandlers } from '@/shared/core/effectHandlers';
import { FETCH_NOTIFICATIONS_REQUESTED } from './msg';

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
    currentUser: null,
};

// Create the store
export const useNotificationStore = createElmStore<Model, import('./msg').Msg>(
    initialNotificationModel,
    update,
    effectHandlers as any,
    (model) => subscriptions(model)
);

// Selectors
export const selectNotificationModel = (state: { model: Model }) => state.model;
export const selectNotificationDispatch = (state: { dispatch: (msg: any) => void }) => state.dispatch;

// Initialize the store with initial data
export const initializeNotificationStore = () => {
    useNotificationStore.getState().dispatch(FETCH_NOTIFICATIONS_REQUESTED());
};