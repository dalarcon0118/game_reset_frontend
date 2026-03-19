import { match } from 'ts-pattern';
import { Model, AppNotification } from './model';
import { Msg } from './msg';
import {
    Cmd,
    Sub,
    RemoteData,
    singleton,
    ret
} from '@core/tea-utils';
import { logger } from '@/shared/utils/logger';

import { NotificationService } from './service';


// 🛠️ INJECT SERVICE
const log = logger.withTag('NOTIFICATION_CORE');

/**
 * 🛰️ SUBSCRIPTIONS
 * Pure reaction to external state changes.
 */
export const subscriptions = (_model: Model) => {
    // SSE is now managed by the infrastructure/kernel.
    // We only react to messages injected by the system.
    return Sub.none();
};

// --- Pure Helper Functions ---

const calculateUnreadCount = (notifications: AppNotification[]): number => {
    return notifications.filter(n => n.status === 'pending').length;
};

const updateNotificationStatus = (notifications: AppNotification[], notificationId: string, status: 'read' | 'pending', timestamp: string): AppNotification[] => {
    return notifications.map(notification =>
        notification.id === notificationId
            ? { ...notification, status, readAt: status === 'read' ? timestamp : undefined }
            : notification
    );
};

const filterNotifications = (notifications: AppNotification[], filter: 'all' | 'pending' | 'read' = 'all'): AppNotification[] => {
    switch (filter) {
        case 'pending': return notifications.filter(n => n.status === 'pending');
        case 'read': return notifications.filter(n => n.status === 'read');
        default: return notifications;
    }
};

/**
 * 🏗️ UPDATE FUNCTION
 * Pure transformation: (Model, Msg) -> [Model, Cmd]
 */
export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match<Msg, any>(msg)
        .with({ type: 'FETCH_NOTIFICATIONS_REQUESTED' }, () => {
            if (model.notifications.type === 'Loading') return singleton(model);
            return ret(
                { ...model, notifications: RemoteData.loading() },
                NotificationService.getInstance().fetchNotifications()
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
                    allNotifications: webData.data
                });
            }
            return singleton({ ...model, notifications: webData });
        })

        .with({ type: 'MARK_AS_READ_REQUESTED' }, ({ notificationId }) => {
            const timestamp = new Date().toISOString();
            const updatedNotifications = updateNotificationStatus(
                model.allNotifications || [],
                notificationId,
                'read',
                timestamp
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
                NotificationService.getInstance().markAsRead(notificationId)
            );
        })

        .with({ type: 'NOTIFICATION_MARKED_READ' }, ({ webData, notificationId }) => {
            if (webData.type === 'Success') {
                const timestamp = new Date().toISOString();
                const updatedNotifications = updateNotificationStatus(
                    model.allNotifications || [],
                    notificationId,
                    'read',
                    timestamp
                );
                const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);
                const unreadCount = calculateUnreadCount(updatedNotifications);
                return singleton({
                    ...model,
                    allNotifications: updatedNotifications,
                    notifications: RemoteData.success(filteredNotifications),
                    unreadCount
                });
            }
            return singleton({ ...model, notifications: webData as any });
        })

        .with({ type: 'MARK_ALL_AS_READ_REQUESTED' }, () => {
            const timestamp = new Date().toISOString();
            const updatedNotifications = (model.allNotifications || []).map(notification => ({
                ...notification,
                status: 'read' as const,
                readAt: timestamp
            }));

            const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);

            return ret(
                {
                    ...model,
                    allNotifications: updatedNotifications,
                    notifications: RemoteData.success(filteredNotifications),
                    unreadCount: 0
                },
                NotificationService.getInstance().markAllAsRead()
            );
        })

        .with({ type: 'ALL_MARKED_READ' }, ({ webData }) => {
            if (webData.type === 'Success') {
                const timestamp = new Date().toISOString();
                const updatedNotifications = (model.allNotifications || []).map(notification => ({
                    ...notification,
                    status: 'read' as const,
                    readAt: timestamp
                }));
                const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);
                return singleton({
                    ...model,
                    allNotifications: updatedNotifications,
                    notifications: RemoteData.success(filteredNotifications),
                    unreadCount: 0
                });
            }
            return singleton({ ...model, notifications: webData as any });
        })

        .with({ type: 'NOTIFICATION_DELETED' }, ({ webData, notificationId }) => {
            if (webData.type === 'Success') {
                const updatedNotifications = (model.allNotifications || []).filter(n => n.id !== notificationId);
                const filteredNotifications = filterNotifications(updatedNotifications, model.currentFilter);
                const unreadCount = calculateUnreadCount(updatedNotifications);
                return singleton({
                    ...model,
                    allNotifications: updatedNotifications,
                    notifications: RemoteData.success(filteredNotifications),
                    unreadCount
                });
            }
            return singleton({ ...model, notifications: webData as any });
        })

        .with({ type: 'NOTIFICATION_SELECTED' }, ({ notification }) => {
            return singleton({ ...model, selectedNotification: notification });
        })

        .with({ type: 'NOTIFICATION_DESELECTED' }, () => {
            return singleton({ ...model, selectedNotification: null });
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
            const allNotifications = (model.allNotifications || []).filter(n => n.id !== notificationId);
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
            return ret(model, NotificationService.getInstance().fetchNotifications());
        })

        .with({ type: 'NOTIFICATION_ERROR' }, ({ error }) => {
            log.error('Notification error', error);
            return singleton(model);
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

            if (notification.status === 'pending') {
                const timestamp = new Date().toISOString();
                const updatedNotifications = updateNotificationStatus(
                    model.allNotifications || [],
                    notification.id,
                    'read',
                    timestamp
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
                    Cmd.batch([navigateCmd, NotificationService.getInstance().markAsRead(notification.id)])
                );
            }

            return ret({ ...model, selectedNotification: notification }, navigateCmd);
        })

        .with({ type: 'NAVIGATE_BACK' }, () => {
            return ret({ ...model, selectedNotification: null }, Cmd.back());
        })

        .with({ type: 'FETCH_PENDING_REWARDS_COUNT_REQUESTED' }, () => {
            return ret(model, NotificationService.getInstance().fetchPendingRewardsCount());
        })

        .with({ type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS' }, ({ count }) => {
            return singleton({ ...model, pendingRewardsCount: count });
        })

        .with({ type: 'NONE' }, () => singleton(model))

        .exhaustive(() => {
            log.warn('Mensaje no procesado:', msg.type);
            return singleton(model);
        });

    return [result.model, result.cmd];
};
