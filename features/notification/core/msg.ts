import { WebData } from '@/shared/core/remote.data';
import { AppNotification, NotificationPreferences, Model } from './model';

export type Msg =
    | { type: 'FETCH_NOTIFICATIONS_REQUESTED' }
    | { type: 'NOTIFICATIONS_RECEIVED'; webData: WebData<AppNotification[]> }
    | { type: 'MARK_AS_READ_REQUESTED'; notificationId: string }
    | { type: 'MARK_AS_READ_SUCCESS'; notificationId: string }
    | { type: 'MARK_ALL_AS_READ_REQUESTED' }
    | { type: 'MARK_ALL_AS_READ_SUCCESS' }
    | { type: 'NOTIFICATION_SELECTED'; notification: AppNotification }
    | { type: 'NOTIFICATION_DESELECTED' }
    | { type: 'FILTER_CHANGED'; filter: 'all' | 'pending' | 'read' }
    | { type: 'PREFERENCES_UPDATED'; preferences: Partial<NotificationPreferences> }
    | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
    | { type: 'REMOVE_NOTIFICATION'; notificationId: string }
    | { type: 'CLEAR_FILTER' }
    | { type: 'REFRESH_NOTIFICATIONS' }
    | { type: 'RESET_STATE' }
    | { type: 'AUTH_TOKEN_UPDATED'; token: string | null }
    | { type: 'AUTH_USER_SYNCED'; user: any }
    | { type: 'NOTIFICATION_ERROR'; error: string };

// Action creators
export const FETCH_NOTIFICATIONS_REQUESTED = (): Msg => ({ type: 'FETCH_NOTIFICATIONS_REQUESTED' });
export const AUTH_TOKEN_UPDATED = (token: string | null): Msg => ({ type: 'AUTH_TOKEN_UPDATED', token });
export const NOTIFICATIONS_RECEIVED = (webData: WebData<AppNotification[]>): Msg => ({
    type: 'NOTIFICATIONS_RECEIVED',
    webData
});
export const RESET_STATE = (): Msg => ({ type: 'RESET_STATE' });
export const MARK_AS_READ_REQUESTED = (notificationId: string): Msg => ({
    type: 'MARK_AS_READ_REQUESTED',
    notificationId
});
export const MARK_AS_READ_SUCCESS = (notificationId: string): Msg => ({
    type: 'MARK_AS_READ_SUCCESS',
    notificationId
});
export const MARK_ALL_AS_READ_REQUESTED = (): Msg => ({ type: 'MARK_ALL_AS_READ_REQUESTED' });
export const MARK_ALL_AS_READ_SUCCESS = (): Msg => ({ type: 'MARK_ALL_AS_READ_SUCCESS' });
export const NOTIFICATION_SELECTED = (notification: AppNotification): Msg => ({
    type: 'NOTIFICATION_SELECTED',
    notification
});
export const NOTIFICATION_DESELECTED = (): Msg => ({ type: 'NOTIFICATION_DESELECTED' });
export const FILTER_CHANGED = (filter: 'all' | 'pending' | 'read'): Msg => ({
    type: 'FILTER_CHANGED',
    filter
});
export const PREFERENCES_UPDATED = (preferences: Partial<NotificationPreferences>): Msg => ({
    type: 'PREFERENCES_UPDATED',
    preferences
});
export const ADD_NOTIFICATION = (notification: AppNotification): Msg => ({
    type: 'ADD_NOTIFICATION',
    notification
});
export const REMOVE_NOTIFICATION = (notificationId: string): Msg => ({
    type: 'REMOVE_NOTIFICATION',
    notificationId
});
export const CLEAR_FILTER = (): Msg => ({ type: 'CLEAR_FILTER' });
export const REFRESH_NOTIFICATIONS = (): Msg => ({ type: 'REFRESH_NOTIFICATIONS' });
export const NOTIFICATION_ERROR = (error: string): Msg => ({
    type: 'NOTIFICATION_ERROR',
    error
});
