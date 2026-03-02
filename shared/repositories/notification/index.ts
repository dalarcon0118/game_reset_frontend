import { NotificationApiAdapter } from './adapters/notification.api.adapter';
import { INotificationRepository } from './notification.ports';

export * from './notification.ports';

// Singleton instance of the repository
export const notificationRepository: INotificationRepository = new NotificationApiAdapter();
