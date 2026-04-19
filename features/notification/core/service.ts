import { INotificationRepository } from '@/shared/repositories/notification/notification.ports';
import { Cmd, RemoteDataHttp } from '@core/tea-utils';
import { Msg } from './msg';
import { AppNotification } from './model';
import { notificationRepository } from '@/shared/repositories/notification';

export class NotificationService {
    static instance: any;
    constructor(
        private notificationRepo: INotificationRepository
    ) { }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService(notificationRepository);
        }
        return NotificationService.instance;
    }
    /**
     * Fetch all notifications
     */
    fetchNotifications(): Cmd {
        return RemoteDataHttp.fetch<AppNotification[], Msg>(
            async () => {
                const result = await this.notificationRepo.getNotifications();
                return result as AppNotification[];
            },
            (webData) => ({ type: 'NOTIFICATIONS_RECEIVED', webData })
        );
    }

    /**
     * Mark a specific notification as read
     */
    markAsRead(notificationId: string): Cmd {
        return RemoteDataHttp.fetch<AppNotification, Msg>(
            async () => {
                const result = await this.notificationRepo.markAsRead(notificationId);
                return result as AppNotification;
            },
            (webData) => ({ type: 'NOTIFICATION_MARKED_READ', webData, notificationId })
        );
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): Cmd {
        return RemoteDataHttp.fetch<void, Msg>(
            async () => {
                await this.notificationRepo.markAllAsRead();
            },
            (webData) => ({ type: 'ALL_MARKED_READ', webData })
        );
    }

    /**
     * Delete a notification
     */
    deleteNotification(notificationId: string): Cmd {
        return RemoteDataHttp.fetch<void, Msg>(
            async () => {
                await this.notificationRepo.deleteNotification(notificationId);
            },
            (webData) => ({ type: 'NOTIFICATION_DELETED', webData, notificationId })
        );
    }

    /**
     * Delete all notifications
     */
    clearAllNotifications(): Cmd {
        return RemoteDataHttp.fetch<void, Msg>(
            async () => {
                await this.notificationRepo.clearAllNotifications();
            },
            (webData) => ({ type: 'NOTIFICATIONS_CLEARED', webData })
        );
    }

    /**
     * Force sync notifications from backend (bypass local cache)
     */
    forceSyncFromBackend(): Cmd {
        return Cmd.task({
            task: async () => {
                return await this.notificationRepo.forceSyncFromBackend();
            },
            onSuccess: (notifications: any[]) => ({ type: 'NOTIFICATIONS_RECEIVED', webData: { type: 'Success', data: notifications } }),
            onFailure: (error: any) => ({ type: 'NOTIFICATIONS_RECEIVED', webData: { type: 'Failure', error: String(error) } } as any)
        });
    }
}
