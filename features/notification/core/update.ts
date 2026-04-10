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
import { NOTIFICATIONS_UPDATED, NETWORK_STATUS_CHANGED } from '@/config/signals';
import { offlineEventBus } from '@core/offline-storage/instance';
import { AuthRepository } from '@/shared/repositories/auth';
import { NotificationOfflineKeys } from '@/shared/repositories/notification/NotificationOfflineKeys';
import { notificationRepository } from '@/shared/repositories/notification';


// 🛠️ INJECT SERVICE
const log = logger.withTag('NOTIFICATION_CORE');

/**
 * 🛰️ SUBSCRIPTIONS
 * Pure reaction to external state changes.
 */
export const subscriptions = (model: Model) => {
    return Sub.batch([
        // 1. Escuchar cambios en el almacenamiento offline (SSOT) de forma reactiva.
        Sub.custom((dispatch) => {
            let isCancelled = false;
            let unsubscribe = () => { };
            let debounceTimer: any = null;

            AuthRepository.getUserIdentity().then(user => {
                if (isCancelled || !user) return;

                const userPattern = NotificationOfflineKeys.getPattern(String(user.id));
                const prefix = userPattern.split('*')[0];

                unsubscribe = offlineEventBus.subscribe((event) => {
                    // Si cualquier notificación del usuario actual cambia, refrescamos el store.
                    if (event.type === 'ENTITY_CHANGED' && event.entity.startsWith(prefix)) {
                        // Anti-flooding: Debounce el refresh para lotes (ej. sync de 50 items)
                        if (debounceTimer) clearTimeout(debounceTimer);

                        debounceTimer = setTimeout(() => {
                            if (!isCancelled) {
                                log.debug('Notification storage changed, refreshing store UI (debounced)');
                                dispatch({ type: 'REFRESH_NOTIFICATIONS' });
                            }
                        }, 5000); // Aumentado a 5s de ventana para agrupar cambios (evita múltiples llamadas si llegan varias notificaciones o hay resyncs)
                    }
                });
            });

            return () => {
                isCancelled = true;
                if (debounceTimer) clearTimeout(debounceTimer);
                unsubscribe();
            };
        }, 'notification_storage_subscription'),

        // 2. Escuchar cambios en la sesión para iniciar/resetear el sistema de notificaciones.
        Sub.custom((dispatch) => {
            log.info('Starting session subscription for notifications');

            const unsubscribe = AuthRepository.onSessionChange((user) => {
                if (user) {
                    log.info(`User authenticated (ID: ${user.id}), fetching notifications...`);
                    dispatch({ type: 'REFRESH_NOTIFICATIONS' });
                    dispatch({ type: 'FETCH_PENDING_REWARDS_COUNT_REQUESTED' });
                } else {
                    log.info('User logged out, resetting notification state');
                    dispatch({ type: 'RESET_STATE' });
                }
            });

            return unsubscribe;
        }, 'notification_session_subscription'),

        // 3. Escuchar cambios de conectividad para notificar al usuario.
        Sub.receiveMsg(
            NETWORK_STATUS_CHANGED,
            (payload, dispatch) => {
                const { isOnline, wasOffline } = payload;
                if (!isOnline && !wasOffline) {
                    dispatch({
                        type: 'ADD_SYSTEM_NOTIFICATION',
                        payload: {
                            title: 'Modo offline activado',
                            message: 'Tus datos se guardarán localmente y se sincronizarán cuando recuperes conexión.',
                            type: 'warning' as const
                        }
                    });
                }
                if (isOnline && wasOffline) {
                    dispatch({
                        type: 'ADD_SYSTEM_NOTIFICATION',
                        payload: {
                            title: 'Conexión recuperada',
                            message: 'Sincronizando datos pendientes...',
                            type: 'success' as const
                        }
                    });
                }
            },
            'notification_network_subscription'
        )
    ]);
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
                return ret(
                    {
                        ...model,
                        notifications: RemoteData.success(filteredNotifications),
                        unreadCount,
                        allNotifications: webData.data
                    },
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount }))
                );
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
                Cmd.batch([
                    NotificationService.getInstance().markAsRead(notificationId),
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount }))
                ])
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
                return ret(
                    {
                        ...model,
                        allNotifications: updatedNotifications,
                        notifications: RemoteData.success(filteredNotifications),
                        unreadCount
                    },
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount }))
                );
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
                Cmd.batch([
                    NotificationService.getInstance().markAllAsRead(),
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount: 0 }))
                ])
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
                return ret(
                    {
                        ...model,
                        allNotifications: updatedNotifications,
                        notifications: RemoteData.success(filteredNotifications),
                        unreadCount: 0
                    },
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount: 0 }))
                );
            }
            return singleton({ ...model, notifications: webData as any });
        })

        .with({ type: 'CLEAR_ALL_NOTIFICATIONS_REQUESTED' }, () => {
            return ret(
                {
                    ...model,
                    allNotifications: [],
                    notifications: RemoteData.success([]),
                    unreadCount: 0
                },
                Cmd.batch([
                    NotificationService.getInstance().clearAllNotifications(),
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount: 0 }))
                ])
            );
        })

        .with({ type: 'NOTIFICATIONS_CLEARED' }, ({ webData }) => {
            if (webData.type === 'Success') {
                return ret(
                    {
                        ...model,
                        allNotifications: [],
                        notifications: RemoteData.success([]),
                        unreadCount: 0
                    },
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount: 0 }))
                );
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

            return ret(
                {
                    ...model,
                    allNotifications: allNotifications,
                    notifications: RemoteData.success(filteredNotifications),
                    unreadCount
                },
                Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount }))
            );
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

        .with({ type: 'SYNC_FROM_BACKEND_REQUESTED' }, () => {
            return ret(
                { ...model, notifications: RemoteData.loading() },
                NotificationService.getInstance().forceSyncFromBackend()
            );
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

        .with({ type: 'NAVIGATE_TO_DETAIL' }, ({ notificationId }) => {
            const notification = model.allNotifications.find(n => n.id === notificationId);
            if (!notification) {
                return singleton(model);
            }

            const navigateCmd = Cmd.navigate(`/notification/detail?id=${notificationId}`);

            if (notification.status === 'pending') {
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
                        selectedNotification: notification,
                        allNotifications: updatedNotifications,
                        notifications: RemoteData.success(filteredNotifications),
                        unreadCount
                    },
                    Cmd.batch([navigateCmd, NotificationService.getInstance().markAsRead(notificationId)])
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

        .with({ type: 'ADD_SYSTEM_NOTIFICATION' }, ({ payload }) => {
            log.info('Adding system notification', payload);

            // Crear notificación usando NotificationRepository
            notificationRepository.addNotification({
                title: payload.title,
                message: payload.message,
                type: payload.type,
                metadata: { source: 'system' }
            }).catch(err => {
                log.error('Failed to add system notification', err);
            });

            // Retornar modelo sin cambios, la notificación se agregará vía SUB cuando se guarde en SSOT
            return singleton(model);
        })

        .with({ type: 'NONE' }, () => singleton(model))

        .exhaustive(() => {
            log.warn('Mensaje no procesado:', msg.type);
            return singleton(model);
        });

    return [result.model, result.cmd];
};
