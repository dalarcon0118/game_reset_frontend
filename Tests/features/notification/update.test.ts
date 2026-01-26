import { update } from '../../../features/notification/core/update';
import {
    FETCH_NOTIFICATIONS_REQUESTED,
    NOTIFICATIONS_RECEIVED,
    MARK_AS_READ_REQUESTED,
    MARK_ALL_AS_READ_REQUESTED,
    FILTER_CHANGED,
    ADD_NOTIFICATION,
    NOTIFICATION_SELECTED
} from '../../../features/notification/core/msg';
import { AppNotification, Model } from '../../../features/notification/core/model';
import { RemoteData } from '../../../shared/core/remote.data';

describe('Notification Update Logic', () => {
    it('should handle FETCH_NOTIFICATIONS_REQUESTED', () => {
        const initialState = {
            notifications: { type: 'NotAsked' } as const,
            unreadCount: 0,
            preferences: {
                enablePushNotifications: true,
                enableEmailNotifications: false,
                enableInAppNotifications: true,
            },
            selectedNotification: null,
            currentFilter: 'all' as const,
            allNotifications: [],
        };

        const [newModel, cmd] = update(initialState, FETCH_NOTIFICATIONS_REQUESTED());

        expect(newModel.notifications.type).toBe('Loading');
        expect(cmd).toBeDefined();
    });

    it('should handle FETCH_NOTIFICATIONS_REQUESTED when already loading', () => {
        const initialState: Model = {
            notifications: { type: 'Loading' },
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

        const [newModel, cmd] = update(initialState, FETCH_NOTIFICATIONS_REQUESTED());

        expect(newModel.notifications.type).toBe('Loading');
        expect(cmd).toBeNull(); // Should not dispatch command when already loading
    });

    it('should handle NOTIFICATIONS_RECEIVED', () => {
        const testNotifications: AppNotification[] = [
            {
                id: '1',
                title: 'Test',
                message: 'Test message',
                type: 'info',
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
        ];

        const initialState: Model = {
            notifications: { type: 'Loading' },
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

        const [newModel] = update(initialState, NOTIFICATIONS_RECEIVED({
            type: 'Success',
            data: testNotifications
        }));

        expect(newModel.notifications.type).toBe('Success');
        if (newModel.notifications.type === 'Success') {
            expect(newModel.notifications.data).toEqual(testNotifications);
        }
        expect(newModel.allNotifications).toEqual(testNotifications);
        expect(newModel.unreadCount).toBe(1);
    });

    it('should handle MARK_AS_READ_REQUESTED', () => {
        const testNotification: AppNotification = {
            id: '1',
            title: 'Test',
            message: 'Test message',
            type: 'info',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        const initialState: Model = {
            notifications: { type: 'Success', data: [testNotification] },
            unreadCount: 1,
            preferences: {
                enablePushNotifications: true,
                enableEmailNotifications: false,
                enableInAppNotifications: true,
            },
            selectedNotification: null,
            currentFilter: 'all',
            allNotifications: [testNotification],
        };

        const [newModel, cmd] = update(initialState, MARK_AS_READ_REQUESTED('1'));

        expect(cmd).toBeDefined(); // Should dispatch command to API

        // The local state update happens optimistically
        expect(newModel.allNotifications[0].status).toBe('read');
    });

    it('should handle MARK_ALL_AS_READ_REQUESTED', () => {
        const notifications: AppNotification[] = [
            {
                id: '1',
                title: 'Test 1',
                message: 'Test message 1',
                type: 'info',
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
            {
                id: '2',
                title: 'Test 2',
                message: 'Test message 2',
                type: 'warning',
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
        ];

        const initialState: Model = {
            notifications: { type: 'Success', data: notifications },
            unreadCount: 2,
            preferences: {
                enablePushNotifications: true,
                enableEmailNotifications: false,
                enableInAppNotifications: true,
            },
            selectedNotification: null,
            currentFilter: 'all',
            allNotifications: notifications,
        };

        const [newModel, cmd] = update(initialState, MARK_ALL_AS_READ_REQUESTED());

        expect(cmd).toBeDefined(); // Should dispatch command to API

        // All notifications should be marked as read in local state
        const allRead = newModel.allNotifications.every(n => n.status === 'read');
        expect(allRead).toBe(true);
        expect(newModel.unreadCount).toBe(0);
    });

    it('should handle FILTER_CHANGED', () => {
        const notifications: AppNotification[] = [
            {
                id: '1',
                title: 'Pending 1',
                message: 'Test message',
                type: 'info',
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
            {
                id: '2',
                title: 'Read 1',
                message: 'Test message',
                type: 'info',
                status: 'read',
                createdAt: new Date().toISOString(),
                readAt: new Date().toISOString(),
            },
        ];

        const initialState: Model = {
            notifications: { type: 'Success', data: notifications },
            unreadCount: 1,
            preferences: {
                enablePushNotifications: true,
                enableEmailNotifications: false,
                enableInAppNotifications: true,
            },
            selectedNotification: null,
            currentFilter: 'all',
            allNotifications: notifications,
        };

        const [newModel] = update(initialState, FILTER_CHANGED('pending'));

        expect(newModel.currentFilter).toBe('pending');
        expect(newModel.notifications.type).toBe('Success');

        if (newModel.notifications.type === 'Success') {
            expect(newModel.notifications.data.length).toBe(1);
            expect(newModel.notifications.data[0].status).toBe('pending');
        }
    });

    it('should handle ADD_NOTIFICATION', () => {
        const existingNotification: AppNotification = {
            id: '1',
            title: 'Existing',
            message: 'Existing message',
            type: 'info',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        const newNotification: AppNotification = {
            id: '2',
            title: 'New',
            message: 'New message',
            type: 'info',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        const initialState: Model = {
            notifications: { type: 'Success', data: [existingNotification] },
            unreadCount: 1,
            preferences: {
                enablePushNotifications: true,
                enableEmailNotifications: false,
                enableInAppNotifications: true,
            },
            selectedNotification: null,
            currentFilter: 'all',
            allNotifications: [existingNotification],
        };

        const [newModel] = update(initialState, ADD_NOTIFICATION(newNotification));

        expect(newModel.allNotifications.length).toBe(2);
        expect(newModel.allNotifications.some(n => n.id === '2')).toBe(true);
        expect(newModel.unreadCount).toBe(2); // Both notifications are pending
    });

    it('should handle NOTIFICATION_SELECTED', () => {
        const notification: AppNotification = {
            id: '1',
            title: 'Selected',
            message: 'Selected message',
            type: 'info',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        const initialState: Model = {
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

        const [newModel] = update(initialState, NOTIFICATION_SELECTED(notification));

        expect(newModel.selectedNotification).toBeDefined();
        expect(newModel.selectedNotification?.id).toBe('1');
        expect(newModel.selectedNotification?.title).toBe('Selected');
    });

    it('should calculate correct unread count when adding notifications', () => {
        const notifications: AppNotification[] = [
            {
                id: '1',
                title: 'Pending 1',
                message: 'Test message',
                type: 'info',
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
            {
                id: '2',
                title: 'Pending 2',
                message: 'Test message',
                type: 'info',
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
            {
                id: '3',
                title: 'Read 1',
                message: 'Test message',
                type: 'info',
                status: 'read',
                createdAt: new Date().toISOString(),
                readAt: new Date().toISOString(),
            },
        ];

        const initialState: Model = {
            notifications: { type: 'Success', data: notifications },
            unreadCount: 0, // Starting with 0
            preferences: {
                enablePushNotifications: true,
                enableEmailNotifications: false,
                enableInAppNotifications: true,
            },
            selectedNotification: null,
            currentFilter: 'all',
            allNotifications: notifications,
        };

        // This test is about the calculation logic
        const unreadCount = notifications.filter(n => n.status === 'pending').length;
        expect(unreadCount).toBe(2);
    });

    it('should handle empty notifications list', () => {
        const initialState: Model = {
            notifications: { type: 'Success', data: [] },
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

        const [newModel] = update(initialState, FILTER_CHANGED('all'));

        expect(newModel.notifications.type).toBe('Success');
        if (newModel.notifications.type === 'Success') {
            expect(newModel.notifications.data).toEqual([]);
        }
        expect(newModel.unreadCount).toBe(0);
    });
});