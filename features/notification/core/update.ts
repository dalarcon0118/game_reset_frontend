import { match } from 'ts-pattern';
import { Model, AppNotification } from './model';
import { Msg } from './msg';
import { initialNotificationModel } from './store';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { singleton, ret } from '@/shared/core/return';
import { NotificationService } from '../../../shared/services/notification_service';
import { useAuthStore } from '../../auth/store/store';
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';

// Subscriptions
export const subscriptions = (model: Model) => {
    // Sync with Auth store for user changes
    const authSub = Sub.watchStore(
        useAuthStore,
        (state: any) => state?.model?.user ?? state?.user,
        (user) => ({ type: 'AUTH_USER_SYNCED', user }),
        'notification-auth-sync'
    );

    // SSE Subscription for real-time notifications
    // We only enable it if we have an authToken and a currentUser
    const subs = [authSub];

    if (model.authToken && model.currentUser) {
        const sseUrl = `${settings.api.baseUrl}/notifications/stream/`;
        const sseSub = Sub.sse(
            sseUrl,
            (payload) => {
                if (payload.type === 'NOTIFICATION_CREATED') {
                    return { type: 'ADD_NOTIFICATION', notification: payload.data };
                }
                return { type: 'NONE' };
            },
            `notifications-sse-${model.authToken}`, // Dynamic ID based on token to force reconnection on change
            { 'Authorization': `Bearer ${model.authToken}` }
        );
        subs.push(sseSub);
    }

    return Sub.batch(subs);
};

// Helper function to calculate unread count
const calculateUnreadCount = (notifications: AppNotification[]): number => {
    return notifications.filter(n => n.status === 'pending').length;
};

// Helper function to update notification status
const updateNotificationStatus = (notifications: AppNotification[], notificationId: string, status: 'read' | 'pending'): AppNotification[] => {
    return notifications.map(notification =>
        notification.id === notificationId
            ? { ...notification, status, readAt: status === 'read' ? new Date().toISOString() : undefined }
            : notification
    );
};

// Helper function to filter notifications based on current filter
const filterNotifications = (notifications: AppNotification[], filter: 'all' | 'pending' | 'read' = 'all'): AppNotification[] => {
    switch (filter) {
        case 'pending':
            return notifications.filter(n => n.status === 'pending');
        case 'read':
            return notifications.filter(n => n.status === 'read');
        case 'all':
        default:
            return notifications;
    }
};

// Cmd functions
const fetchNotificationsCmd = (): Cmd => {
    return RemoteDataHttp.fetch<AppNotification[], Msg>(
        async () => {
            const result = await NotificationService.getNotifications();
            return result as AppNotification[];
        },
        (webData) => ({ type: 'NOTIFICATIONS_RECEIVED', webData })
    );
};

const markAsReadCmd = (notificationId: string): Cmd => {
    return RemoteDataHttp.fetch<AppNotification, Msg>(
        async () => {
            const result = await NotificationService.markAsRead(notificationId);
            return result as AppNotification;
        },
        (webData) => {
            if (webData.type === 'Success') {
                return { type: 'MARK_AS_READ_SUCCESS', notificationId };
            }
            return { type: 'NOTIFICATION_ERROR', error: 'Failed to mark notification as read' };
        }
    );
};

const markAllAsReadCmd = (): Cmd => {
    return RemoteDataHttp.fetch<any, Msg>(
        () => NotificationService.markAllAsRead(),
        (webData) => {
            if (webData.type === 'Success') {
                return { type: 'MARK_ALL_AS_READ_SUCCESS' };
            }
            return { type: 'NOTIFICATION_ERROR', error: 'Failed to mark all notifications as read' };
        }
    );
};

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match<Msg, any>(msg)
        .with({ type: 'FETCH_NOTIFICATIONS_REQUESTED' }, () => {
            if (model.notifications.type === 'Loading') {
                return singleton(model);
            }

            return ret(
                {
                    ...model,
                    notifications: RemoteData.loading()
                },
                fetchNotificationsCmd()
            );
        })

        .with({ type: 'NOTIFICATIONS_RECEIVED' }, ({ webData }) => {
            if (webData.type === 'Success') {
                const filteredNotifications = filterNotifications(webData.data, model.currentFilter);
                const unreadCount = calculateUnreadCount(webData.data);

                return singleton({
                    ...model,
                    notifications: RemoteData.success(filteredNotifications),
                    unreadCount,
                    allNotifications: webData.data // Store all notifications for filtering
                });
            }
            return singleton({ ...model, notifications: webData });
        })

        .with({ type: 'MARK_AS_READ_REQUESTED' }, ({ notificationId }) => {
            const updatedNotifications = updateNotificationStatus(
                model.allNotifications || [],
                notificationId,
                'read'
            );

            const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);
            const unreadCount = calculateUnreadCount(updatedNotifications);

            return ret(
                {
                    ...model,
                    allNotifications: updatedNotifications,
                    notifications: RemoteData.success(filteredNotifications),
                    unreadCount
                },
                markAsReadCmd(notificationId)
            );
        })

        .with({ type: 'MARK_AS_READ_SUCCESS' }, ({ notificationId }) => {
            // Update local state after successful API call
            const updatedNotifications = updateNotificationStatus(
                model.allNotifications || [],
                notificationId,
                'read'
            );

            const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);
            const unreadCount = calculateUnreadCount(updatedNotifications);

            return singleton({
                ...model,
                allNotifications: updatedNotifications,
                notifications: RemoteData.success(filteredNotifications),
                unreadCount
            });
        })

        .with({ type: 'MARK_ALL_AS_READ_REQUESTED' }, () => {
            const updatedNotifications = (model.allNotifications || []).map(notification => ({
                ...notification,
                status: 'read' as const,
                readAt: new Date().toISOString()
            }));

            const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);
            const unreadCount = 0; // All marked as read

            return ret(
                {
                    ...model,
                    allNotifications: updatedNotifications,
                    notifications: RemoteData.success(filteredNotifications),
                    unreadCount
                },
                markAllAsReadCmd()
            );
        })

        .with({ type: 'MARK_ALL_AS_READ_SUCCESS' }, () => {
            const updatedNotifications = (model.allNotifications || []).map(notification => ({
                ...notification,
                status: 'read' as const,
                readAt: new Date().toISOString()
            }));

            const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);

            return singleton({
                ...model,
                allNotifications: updatedNotifications,
                notifications: RemoteData.success(filteredNotifications),
                unreadCount: 0
            });
        })

        .with({ type: 'NOTIFICATION_SELECTED' }, ({ notification }) => {
            return singleton({
                ...model,
                selectedNotification: notification
            });
        })

        .with({ type: 'NOTIFICATION_DESELECTED' }, () => {
            return singleton({
                ...model,
                selectedNotification: null
            });
        })

        .with({ type: 'FILTER_CHANGED' }, ({ filter }) => {
            const allNotifications = model.allNotifications || [];
            const filteredNotifications = filterNotifications(allNotifications, filter);
            const unreadCount = calculateUnreadCount(allNotifications);

            return singleton({
                ...model,
                notifications: RemoteData.success(filteredNotifications),
                currentFilter: filter,
                unreadCount
            });
        })

        .with({ type: 'PREFERENCES_UPDATED' }, ({ preferences }) => {
            return singleton({
                ...model,
                preferences: { ...model.preferences, ...preferences }
            });
        })

        .with({ type: 'ADD_NOTIFICATION' }, ({ notification }) => {
            const allNotifications = [notification, ...(model.allNotifications || [])];
            const filteredNotifications = filterNotifications(allNotifications, model.currentFilter);
            const unreadCount = calculateUnreadCount(allNotifications);

            return singleton({
                ...model,
                allNotifications: allNotifications,
                notifications: RemoteData.success(filteredNotifications),
                unreadCount
            });
        })

        .with({ type: 'REMOVE_NOTIFICATION' }, ({ notificationId }) => {
            const allNotifications = (model.allNotifications || []).filter(
                n => n.id !== notificationId
            );
            const filteredNotifications = filterNotifications(allNotifications, model.currentFilter);
            const unreadCount = calculateUnreadCount(allNotifications);

            return singleton({
                ...model,
                allNotifications: allNotifications,
                notifications: RemoteData.success(filteredNotifications),
                unreadCount
            });
        })

        .with({ type: 'CLEAR_FILTER' }, () => {
            const allNotifications = model.allNotifications || [];
            const unreadCount = calculateUnreadCount(allNotifications);

            return singleton({
                ...model,
                notifications: RemoteData.success(allNotifications),
                currentFilter: 'all',
                unreadCount
            });
        })

        .with({ type: 'REFRESH_NOTIFICATIONS' }, () => {
            return ret(model, fetchNotificationsCmd());
        })

        .with({ type: 'NOTIFICATION_ERROR' }, ({ error }) => {
            console.error('Notification error:', error);
            return singleton(model);
        })

        .with({ type: 'AUTH_USER_SYNCED' }, ({ user }) => {
            // Only update and trigger task if the user has actually changed OR if we don't have a token
            const currentUserId = model.currentUser?.id || model.currentUser?.pk;
            const nextUserId = user?.id || user?.pk;

            // If user is null, reset state
            if (!user) {
                return singleton({
                    ...model,
                    currentUser: null,
                    authToken: null
                });
            }

            // If user is the same AND we already have a token, do nothing
            if (currentUserId === nextUserId && model.authToken !== null) {
                return singleton(model);
            }

            return ret(
                { ...model, currentUser: user },
                Cmd.task({
                    task: () => apiClient.getAuthToken(),
                    onSuccess: (token) => ({ type: 'AUTH_TOKEN_UPDATED', token }),
                    onFailure: () => ({ type: 'NONE' } as any)
                })
            );
        })

        .with({ type: 'AUTH_TOKEN_UPDATED' }, ({ token }) => {
            if (model.authToken === token) {
                return singleton(model);
            }
            return singleton({ ...model, authToken: token });
        })

        .with({ type: 'RESET_STATE' }, () => singleton({
            ...model,
            notifications: RemoteData.notAsked(),
            unreadCount: 0,
            allNotifications: [],
            selectedNotification: null
        }))

        .with({ type: 'NAVIGATE_TO_DETAIL' }, ({ notification }) => {
            const notificationParam = encodeURIComponent(JSON.stringify(notification));
            const navigateCmd = Cmd.navigate(`/notification/detail?notification=${notificationParam}`);

            // Si la notificación está pendiente, también disparamos la marca de lectura
            if (notification.status === 'pending') {
                const updatedNotifications = updateNotificationStatus(
                    model.allNotifications || [],
                    notification.id,
                    'read'
                );

                const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);
                const unreadCount = calculateUnreadCount(updatedNotifications);

                return ret(
                    {
                        ...model,
                        selectedNotification: notification,
                        allNotifications: updatedNotifications,
                        notifications: RemoteData.success(filteredNotifications),
                        unreadCount
                    },
                    Cmd.batch([navigateCmd, markAsReadCmd(notification.id)])
                );
            }

            return ret(
                { ...model, selectedNotification: notification },
                navigateCmd
            );
        })

        .with({ type: 'NAVIGATE_BACK' }, () => {
            return ret(
                { ...model, selectedNotification: null },
                Cmd.back()
            );
        })

        .with({ type: 'NONE' }, () => singleton(model))

        .exhaustive();

    return [result.model, result.cmd];
};