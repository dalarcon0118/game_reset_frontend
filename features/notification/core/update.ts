import { match } from 'ts-pattern';
import { Model, AppNotification } from './model';
import { Msg } from './msg';
import {
    Cmd,
    Sub,
    RemoteData,
    singleton,
    ret,
    RemoteDataHttp
} from '@core/tea-utils';
import { logger } from '@/shared/utils/logger';

import { NOTIFICATIONS_UPDATED, NETWORK_STATUS_CHANGED } from '@/config/signals';
import { offlineEventBus } from '@core/offline-storage/instance';
import { AuthRepository } from '@/shared/repositories/auth';
import { NotificationOfflineKeys } from '@/shared/repositories/notification/NotificationOfflineKeys';
import { notificationRepository } from '@/shared/repositories/notification';
import { TimerRepository } from '@/shared/repositories/system/time';
import { selectUnreadCount, selectFilteredNotifications } from './selectors';

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
                                dispatch({ type: 'FETCH_NOTIFICATIONS_REQUESTED' });
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
                    dispatch({ type: 'FETCH_NOTIFICATIONS_REQUESTED' });
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

const getTrustedTimestamp = (): string => {
    try {
        return new Date(TimerRepository.getTrustedNow(Date.now())).toISOString();
    } catch {
        return new Date().toISOString();
    }
};

const updateNotificationStatus = (notifications: AppNotification[], notificationId: string, status: 'read' | 'pending', timestamp: string): AppNotification[] => {
    return notifications.map(notification =>
        notification.id === notificationId
            ? { ...notification, status, readAt: status === 'read' ? timestamp : undefined }
            : notification
    );
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
                RemoteDataHttp.fetch<AppNotification[], Msg>(
                    () => notificationRepository.getNotifications() as Promise<AppNotification[]>,
                    (webData) => ({ type: 'NOTIFICATIONS_RECEIVED', webData })
                )
            );
        })

        .with({ type: 'NOTIFICATIONS_RECEIVED' }, ({ webData }) => {
            if (webData.type === 'Success') {
                const filteredNotifications = selectFilteredNotifications({ ...model, allNotifications: webData.data });
                const unreadCount = selectUnreadCount({ ...model, allNotifications: webData.data });
                return ret(
                    {
                        ...model,
                        notifications: RemoteData.success(filteredNotifications),
                        allNotifications: webData.data
                    },
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount }))
                );
            }
            return singleton({ ...model, notifications: webData });
        })

        .with({ type: 'MARK_AS_READ_REQUESTED' }, ({ notificationId }) => {
            const timestamp = getTrustedTimestamp();
            const updatedNotifications = updateNotificationStatus(
                model.allNotifications || [],
                notificationId,
                'read',
                timestamp
            );

            const filteredNotifications = selectFilteredNotifications({ ...model, allNotifications: updatedNotifications });
            const unreadCount = selectUnreadCount({ ...model, allNotifications: updatedNotifications });

            return ret(
                {
                    ...model,
                    allNotifications: updatedNotifications,
                    notifications: RemoteData.success(filteredNotifications)
                },
                Cmd.batch([
                    RemoteDataHttp.fetch<AppNotification, Msg>(
                        () => notificationRepository.markAsRead(notificationId) as Promise<AppNotification>,
                        (webData) => ({ type: 'NOTIFICATION_MARKED_READ', webData, notificationId })
                    ),
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount }))
                ])
            );
        })

        .with({ type: 'NOTIFICATION_MARKED_READ' }, ({ webData, notificationId }) => {
            // Optimistic update already applied, only handle error case if needed
            if (webData.type === 'Failure') {
                // TODO: Revert optimistic update on failure (requires storing previous state)
                log.warn('Failed to mark notification as read', webData.error);
            }
            return singleton({ ...model, notifications: RemoteData.success(selectFilteredNotifications(model)) });
        })

        .with({ type: 'MARK_ALL_AS_READ_REQUESTED' }, () => {
            const timestamp = getTrustedTimestamp();
            const updatedNotifications = (model.allNotifications || []).map(notification => ({
                ...notification,
                status: 'read' as const,
                readAt: timestamp
            }));

            const filteredNotifications = selectFilteredNotifications({ ...model, allNotifications: updatedNotifications });

            return ret(
                {
                    ...model,
                    allNotifications: updatedNotifications,
                    notifications: RemoteData.success(filteredNotifications)
                },
                Cmd.batch([
                    RemoteDataHttp.fetch<void, Msg>(
                        () => notificationRepository.markAllAsRead() as Promise<void>,
                        (webData) => ({ type: 'ALL_MARKED_READ', webData })
                    ),
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount: 0 }))
                ])
            );
        })

        .with({ type: 'ALL_MARKED_READ' }, ({ webData }) => {
            // Optimistic update already applied, only handle error case
            if (webData.type === 'Failure') {
                log.warn('Failed to mark all notifications as read', webData.error);
            }
            return singleton(model);
        })

        .with({ type: 'CLEAR_ALL_NOTIFICATIONS_REQUESTED' }, () => {
            return ret(
                {
                    ...model,
                    allNotifications: [],
                    notifications: RemoteData.success([])
                },
                Cmd.batch([
                    RemoteDataHttp.fetch<void, Msg>(
                        () => notificationRepository.clearAllNotifications() as Promise<void>,
                        (webData) => ({ type: 'NOTIFICATIONS_CLEARED', webData })
                    ),
                    Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount: 0 }))
                ])
            );
        })

        .with({ type: 'NOTIFICATIONS_CLEARED' }, ({ webData }) => {
            // Optimistic update already applied, only handle error case
            if (webData.type === 'Failure') {
                log.warn('Failed to clear notifications', webData.error);
            }
            return singleton(model);
        })

        .with({ type: 'NOTIFICATION_DELETED' }, ({ webData, notificationId }) => {
            // Optimistic update already applied, only handle error case
            if (webData.type === 'Failure') {
                log.warn('Failed to delete notification', webData.error);
            }
            return singleton(model);
        })

        .with({ type: 'NOTIFICATION_SELECTED' }, ({ notification }) => {
            return singleton({ ...model, selectedNotification: notification });
        })

        .with({ type: 'NOTIFICATION_DESELECTED' }, () => {
            return singleton({ ...model, selectedNotification: null });
        })

        .with({ type: 'FILTER_CHANGED' }, ({ filter }) => {
            const allNotifications = model.allNotifications || [];
            const filteredNotifications = selectFilteredNotifications({ ...model, allNotifications, currentFilter: filter });

            return singleton({
                ...model,
                notifications: RemoteData.success(filteredNotifications),
                currentFilter: filter
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
            const filteredNotifications = selectFilteredNotifications({ ...model, allNotifications });
            const unreadCount = selectUnreadCount({ ...model, allNotifications });

            return ret(
                {
                    ...model,
                    allNotifications: allNotifications,
                    notifications: RemoteData.success(filteredNotifications)
                },
                Cmd.sendMsg(NOTIFICATIONS_UPDATED({ unreadCount }))
            );
        })

        .with({ type: 'REMOVE_NOTIFICATION' }, ({ notificationId }) => {
            const allNotifications = (model.allNotifications || []).filter(n => n.id !== notificationId);
            const filteredNotifications = selectFilteredNotifications({ ...model, allNotifications });

            return singleton({
                ...model,
                allNotifications: allNotifications,
                notifications: RemoteData.success(filteredNotifications)
            });
        })

        .with({ type: 'CLEAR_FILTER' }, () => {
            const allNotifications = model.allNotifications || [];
            const filteredNotifications = selectFilteredNotifications({ ...model, allNotifications, currentFilter: 'all' });

            return singleton({
                ...model,
                notifications: RemoteData.success(filteredNotifications),
                currentFilter: 'all'
            });
        })

	.with({ type: 'SYNC_FROM_BACKEND_REQUESTED' }, () => {
            return ret(
                { ...model, notifications: RemoteData.loading() },
                Cmd.task({
                    task: async () => {
                        return await notificationRepository.forceSyncFromBackend();
                    },
                    onSuccess: (notifications: any[]) => ({ type: 'NOTIFICATIONS_RECEIVED', webData: { type: 'Success', data: notifications } }),
                    onFailure: (error: any) => ({ type: 'NOTIFICATIONS_RECEIVED', webData: { type: 'Failure', error: String(error) } } as any)
                })
            );
        })

        .with({ type: 'NOTIFICATION_ERROR' }, ({ error }) => {
            log.error('Notification error', error);
            return singleton(model);
        })

        .with({ type: 'RESET_STATE' }, () => singleton({
            ...model,
            notifications: RemoteData.notAsked(),
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
                const timestamp = getTrustedTimestamp();
                const updatedNotifications = updateNotificationStatus(
                    model.allNotifications || [],
                    notificationId,
                    'read',
                    timestamp
                );

const filteredNotifications = selectFilteredNotifications({ ...model, allNotifications: updatedNotifications });

            return ret(
                {
                    ...model,
                    selectedNotification: notification,
                    allNotifications: updatedNotifications,
                        notifications: RemoteData.success(filteredNotifications)
                    },
                    Cmd.batch([
                        navigateCmd,
                        RemoteDataHttp.fetch<AppNotification, Msg>(
                            () => notificationRepository.markAsRead(notificationId) as Promise<AppNotification>,
                            (webData) => ({ type: 'NOTIFICATION_MARKED_READ', webData, notificationId })
                        )
                    ])
                );
            }

            return ret({ ...model, selectedNotification: notification }, navigateCmd);
        })

        .with({ type: 'NAVIGATE_BACK' }, () => {
            return ret({ ...model, selectedNotification: null }, Cmd.back());
        })

        .with({ type: 'ADD_SYSTEM_NOTIFICATION' }, ({ payload }) => {
            log.info('Adding system notification', payload);

            return ret(
                model,
                Cmd.task({
                    task: async () => {
                        await notificationRepository.addNotification({
                            title: payload.title,
                            message: payload.message,
                            type: payload.type,
                            metadata: { source: 'system' }
                        });
                    },
                    onSuccess: () => ({ type: 'NONE' } as Msg),
                    onFailure: (err) => {
                        log.error('Failed to add system notification', err);
                        return { type: 'NOTIFICATION_ERROR', error: String(err) } as Msg;
                    }
                })
            );
        })

        .with({ type: 'NONE' }, () => singleton(model))

        .exhaustive(() => {
            log.warn('Mensaje no procesado:', msg.type);
            return singleton(model);
        });

    return [result.model, result.cmd];
};
