import { useNotificationStore } from '../../../features/notification/core/store';
import {
    FETCH_NOTIFICATIONS_REQUESTED,
    MARK_AS_READ_REQUESTED,
    MARK_ALL_AS_READ_REQUESTED,
    FILTER_CHANGED,
    ADD_NOTIFICATION,
    NOTIFICATION_SELECTED,
    RESET_STATE
} from '../../../features/notification/core/msg';
import { AppNotification } from '../../../features/notification/core/model';

describe('Notification Store', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useNotificationStore.getState().dispatch(RESET_STATE());
    });

    it('should initialize with correct initial state', () => {
        const { model } = useNotificationStore.getState();

        expect(model.notifications.type).toBe('NotAsked');
        expect(model.unreadCount).toBe(0);
        expect(model.preferences.enablePushNotifications).toBe(true);
        expect(model.selectedNotification).toBeNull();
        expect(model.currentFilter).toBe('all');
        expect(model.allNotifications).toEqual([]);
    });

    it('should handle FETCH_NOTIFICATIONS_REQUESTED', () => {
        const { dispatch } = useNotificationStore.getState();
        dispatch(FETCH_NOTIFICATIONS_REQUESTED());

        const { model } = useNotificationStore.getState();
        expect(model.notifications.type).toBe('Loading');
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

        const { dispatch } = useNotificationStore.getState();

        // Add notification first
        dispatch(ADD_NOTIFICATION(testNotification));

        // Then mark as read
        dispatch(MARK_AS_READ_REQUESTED('1'));

        const { model } = useNotificationStore.getState();
        const notification = model.allNotifications.find(n => n.id === '1');

        expect(notification?.status).toBe('read');
        expect(notification?.readAt).toBeDefined();
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

        const { dispatch } = useNotificationStore.getState();

        // Add notifications
        notifications.forEach(notification => {
            dispatch(ADD_NOTIFICATION(notification));
        });

        // Mark all as read
        dispatch(MARK_ALL_AS_READ_REQUESTED());

        const { model } = useNotificationStore.getState();
        const allRead = model.allNotifications.every(n => n.status === 'read');

        expect(allRead).toBe(true);
        expect(model.unreadCount).toBe(0);
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

        const { dispatch } = useNotificationStore.getState();

        // Add notifications
        notifications.forEach(notification => {
            dispatch(ADD_NOTIFICATION(notification));
        });

        // Change filter to pending
        dispatch(FILTER_CHANGED('pending'));

        const { model } = useNotificationStore.getState();
        const pendingNotifications = model.notifications.type === 'Success'
            ? model.notifications.data
            : [];

        expect(pendingNotifications.length).toBe(1);
        expect(pendingNotifications[0].status).toBe('pending');
    });

    it('should handle ADD_NOTIFICATION', () => {
        const newNotification: AppNotification = {
            id: '1',
            title: 'New Notification',
            message: 'New message',
            type: 'info',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        const { dispatch } = useNotificationStore.getState();
        dispatch(ADD_NOTIFICATION(newNotification));

        const { model } = useNotificationStore.getState();
        const notification = model.allNotifications.find(n => n.id === '1');

        expect(notification).toBeDefined();
        expect(notification?.title).toBe('New Notification');
        expect(notification?.status).toBe('pending');
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

        const { dispatch } = useNotificationStore.getState();
        dispatch(NOTIFICATION_SELECTED(notification));

        const { model } = useNotificationStore.getState();

        expect(model.selectedNotification).toBeDefined();
        expect(model.selectedNotification?.id).toBe('1');
        expect(model.selectedNotification?.title).toBe('Selected');
    });

    it('should calculate correct unread count', () => {
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

        const { dispatch } = useNotificationStore.getState();

        // Add notifications
        notifications.forEach(notification => {
            dispatch(ADD_NOTIFICATION(notification));
        });

        const { model } = useNotificationStore.getState();

        expect(model.unreadCount).toBe(2);
    });
});