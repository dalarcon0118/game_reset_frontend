import {
    FETCH_NOTIFICATIONS_REQUESTED,
    MARK_AS_READ_REQUESTED,
    MARK_ALL_AS_READ_REQUESTED,
    NOTIFICATION_SELECTED,
    NOTIFICATION_DESELECTED,
    FILTER_CHANGED,
    PREFERENCES_UPDATED,
    ADD_NOTIFICATION,
    REMOVE_NOTIFICATION,
    CLEAR_FILTER,
    REFRESH_NOTIFICATIONS,
    NOTIFICATION_ERROR,
    Msg
} from '../core/msg';
import { AppNotification } from '../core/model';

describe('Notification Messages', () => {
    describe('FETCH_NOTIFICATIONS_REQUESTED', () => {
        it('should create FETCH_NOTIFICATIONS_REQUESTED message', () => {
            const msg = FETCH_NOTIFICATIONS_REQUESTED();

            expect(msg).toEqual({ type: 'FETCH_NOTIFICATIONS_REQUESTED' });
        });
    });

    describe('MARK_AS_READ_REQUESTED', () => {
        it('should create MARK_AS_READ_REQUESTED message with notificationId', () => {
            const notificationId = '123';
            const msg = MARK_AS_READ_REQUESTED(notificationId);

            expect(msg).toEqual({ type: 'MARK_AS_READ_REQUESTED', notificationId });
        });
    });

    describe('MARK_ALL_AS_READ_REQUESTED', () => {
        it('should create MARK_ALL_AS_READ_REQUESTED message', () => {
            const msg = MARK_ALL_AS_READ_REQUESTED();

            expect(msg).toEqual({ type: 'MARK_ALL_AS_READ_REQUESTED' });
        });
    });

    describe('NOTIFICATION_SELECTED', () => {
        it('should create NOTIFICATION_SELECTED message with notification', () => {
            const notification: AppNotification = {
                id: '1',
                title: 'Test',
                message: 'Test message',
                type: 'info',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00Z',
            };
            const msg = NOTIFICATION_SELECTED(notification);

            expect(msg).toEqual({ type: 'NOTIFICATION_SELECTED', notification });
        });
    });

    describe('NOTIFICATION_DESELECTED', () => {
        it('should create NOTIFICATION_DESELECTED message', () => {
            const msg = NOTIFICATION_DESELECTED();

            expect(msg).toEqual({ type: 'NOTIFICATION_DESELECTED' });
        });
    });

    describe('FILTER_CHANGED', () => {
        it('should create FILTER_CHANGED message with filter', () => {
            const filter: 'all' | 'pending' | 'read' = 'pending';
            const msg = FILTER_CHANGED(filter);

            expect(msg).toEqual({ type: 'FILTER_CHANGED', filter });
        });
    });

    describe('PREFERENCES_UPDATED', () => {
        it('should create PREFERENCES_UPDATED message with partial preferences', () => {
            const preferences = { enablePushNotifications: true };
            const msg = PREFERENCES_UPDATED(preferences);

            expect(msg).toEqual({ type: 'PREFERENCES_UPDATED', preferences });
        });
    });

    describe('ADD_NOTIFICATION', () => {
        it('should create ADD_NOTIFICATION message with notification', () => {
            const notification: AppNotification = {
                id: '1',
                title: 'Test',
                message: 'Test message',
                type: 'info',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00Z',
            };
            const msg = ADD_NOTIFICATION(notification);

            expect(msg).toEqual({ type: 'ADD_NOTIFICATION', notification });
        });
    });

    describe('REMOVE_NOTIFICATION', () => {
        it('should create REMOVE_NOTIFICATION message with notificationId', () => {
            const notificationId = '123';
            const msg = REMOVE_NOTIFICATION(notificationId);

            expect(msg).toEqual({ type: 'REMOVE_NOTIFICATION', notificationId });
        });
    });

    describe('CLEAR_FILTER', () => {
        it('should create CLEAR_FILTER message', () => {
            const msg = CLEAR_FILTER();

            expect(msg).toEqual({ type: 'CLEAR_FILTER' });
        });
    });

    describe('REFRESH_NOTIFICATIONS', () => {
        it('should create REFRESH_NOTIFICATIONS message', () => {
            const msg = REFRESH_NOTIFICATIONS();

            expect(msg).toEqual({ type: 'REFRESH_NOTIFICATIONS' });
        });
    });

    describe('NOTIFICATION_ERROR', () => {
        it('should create NOTIFICATION_ERROR message with error', () => {
            const error = 'Something went wrong';
            const msg = NOTIFICATION_ERROR(error);

            expect(msg).toEqual({ type: 'NOTIFICATION_ERROR', error });
        });
    });

    describe('Message Union Type', () => {
        it('should support all message types in union', () => {
            const messages: Msg[] = [
                { type: 'FETCH_NOTIFICATIONS_REQUESTED' },
                { type: 'MARK_AS_READ_REQUESTED', notificationId: '123' },
                { type: 'MARK_AS_READ_SUCCESS', notificationId: '123' },
                { type: 'MARK_ALL_AS_READ_REQUESTED' },
                { type: 'MARK_ALL_AS_READ_SUCCESS' },
                { type: 'NOTIFICATION_SELECTED', notification: { id: '1', title: 'Test', message: 'Test', type: 'info', status: 'pending', createdAt: '2024-01T0:00:00Z' } },
                { type: 'NOTIFICATION_DESELECTED' },
                { type: 'FILTER_CHANGED', filter: 'all' },
                { type: 'PREFERENCES_UPDATED', preferences: { enablePushNotifications: true } },
                { type: 'ADD_NOTIFICATION', notification: { id: '1', title: 'Test', message: 'Test', type: 'info', status: 'pending', createdAt: '2024-01-01T00:00:00Z' } },
                { type: 'REMOVE_NOTIFICATION', notificationId: '123' },
                { type: 'CLEAR_FILTER' },
                { type: 'REFRESH_NOTIFICATIONS' },
                { type: 'NOTIFICATION_ERROR', error: 'Error' },
            ];

            expect(messages).toHaveLength(14);
        });
    });
});