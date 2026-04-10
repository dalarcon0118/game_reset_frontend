import { INotificationRepository } from '@/shared/repositories/notification/notification.ports';
import { IWinningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { Cmd, RemoteDataHttp } from '@core/tea-utils';
import { Msg } from './msg';
import { AppNotification } from './model';
import { notificationRepository } from '@/shared/repositories/notification';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
/**
 * 🛠️ NOTIFICATION SERVICE
 * Manages the injection of repositories and creation of pure Cmds.
 */
export class NotificationService {
    static instance: any;
    constructor(
        private notificationRepo: INotificationRepository,
        private winningsRepo: IWinningsRepository
    ) { }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService(notificationRepository, winningsRepository);
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
     * Fetch the count of pending rewards
     */
    fetchPendingRewardsCount(): Cmd {
        return Cmd.task({
            task: async () => {
                try {
                    return await this.winningsRepo.getPendingRewardsCount();
                } catch (error) {
                    return 0;
                }
            },
            onSuccess: (count: number) => ({ type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS', count }),
            onFailure: () => ({ type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS', count: 0 } as any)
        });
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
