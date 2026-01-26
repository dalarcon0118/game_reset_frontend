import { AppNotification, NotificationPreferences, Model } from '../core/model';

describe('Notification Model', () => {
    describe('AppNotification', () => {
        it('should have all required properties', () => {
            const notification: AppNotification = {
                id: '1',
                title: 'Test Notification',
                message: 'This is a test notification',
                type: 'info',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00Z',
            };

            expect(notification.id).toBe('1');
            expect(notification.title).toBe('Test Notification');
            expect(notification.message).toBe('This is a test notification');
            expect(notification.type).toBe('info');
            expect(notification.status).toBe('pending');
            expect(notification.createdAt).toBe('2024-01-01T00:00:00Z');
        });

        it('should support all notification types', () => {
            const notificationTypes: ('info' | 'warning' | 'error' | 'success')[] = ['info', 'warning', 'error', 'success'];

            notificationTypes.forEach(type => {
                const notification: AppNotification = {
                    id: '1',
                    title: 'Test',
                    message: 'Test message',
                    type,
                    status: 'pending',
                    createdAt: '2024-01-01T00:00:00Z',
                };

                expect(notification.type).toBe(type);
            });
        });

        it('should support both statuses', () => {
            const statuses: ('pending' | 'read')[] = ['pending', 'read'];

            statuses.forEach(status => {
                const notification: AppNotification = {
                    id: '1',
                    title: 'Test',
                    message: 'Test message',
                    type: 'info',
                    status,
                    createdAt: '2024-01-01T00:00:00Z',
                };

                expect(notification.status).toBe(status);
            });
        });
    });

    describe('NotificationPreferences', () => {
        it('should have all required preference properties', () => {
            const preferences: NotificationPreferences = {
                enablePushNotifications: true,
                enableEmailNotifications: false,
                enableInAppNotifications: true,
            };

            expect(preferences.enablePushNotifications).toBe(true);
            expect(preferences.enableEmailNotifications).toBe(false);
            expect(preferences.enableInAppNotifications).toBe(true);
        });
    });

    describe('Model', () => {
        it('should have all required model properties', () => {
            const model: Model = {
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
            };

            expect(model.notifications.type).toBe('NotAsked');
            expect(model.unreadCount).toBe(0);
            expect(model.selectedNotification).toBeNull();
            expect(model.currentFilter).toBe('all');
            expect(model.allNotifications).toEqual([]);
        });
    });
});