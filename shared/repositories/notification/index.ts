import { NotificationRepository } from './notification.repository';
import { INotificationRepository } from './notification.ports';

export * from './notification.ports';

// Singleton instance of the repository (SSOT & Offline-First)
export const notificationRepository: INotificationRepository = new NotificationRepository();
