import { renderHook, act } from '@testing-library/react-native';
import { useNotificationStore } from '../../../features/notification/core/store';
import {
    FETCH_NOTIFICATIONS_REQUESTED,
    MARK_AS_READ_REQUESTED,
    MARK_ALL_AS_READ_REQUESTED,
    ADD_NOTIFICATION,
    RESET_STATE
} from '../../../features/notification/core/msg';
import { AppNotification } from '../../../features/notification/core/model';
import fetchMock from 'jest-fetch-mock';

describe('Notification Integration Tests', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
        // Reset store to initial state
        const { dispatch } = useNotificationStore.getState();
        dispatch(RESET_STATE());
    });

    describe('Backend API Integration', () => {
        it('should fetch notifications from backend API', async () => {
            const mockNotifications: AppNotification[] = [
                {
                    id: '1',
                    title: 'Welcome Notification',
                    message: 'Welcome to the application!',
                    type: 'info',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                },
                {
                    id: '2',
                    title: 'System Update',
                    message: 'A new version is available',
                    type: 'warning',
                    status: 'read',
                    createdAt: new Date().toISOString(),
                    readAt: new Date().toISOString(),
                },
            ];

            // Mock successful paginated response
            fetchMock.mockResponseOnce(JSON.stringify({
                results: mockNotifications,
                count: mockNotifications.length,
                next: null,
                previous: null,
            }));

            const { result } = renderHook(() => useNotificationStore());

            await act(async () => {
                result.current.dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            });

            // Wait for potential async effects
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0][0]).toContain('/api/notifications/');

            const { model } = result.current;
            expect(model.notifications.type).toBe('Success');

            if (model.notifications.type === 'Success') {
                expect(model.notifications.data).toHaveLength(2);
                expect(model.notifications.data[0].id).toBe('1');
                expect(model.notifications.data[1].id).toBe('2');
            }
        });

        it('should handle API errors when fetching notifications', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });

            const { result } = renderHook(() => useNotificationStore());

            await act(async () => {
                result.current.dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const { model } = result.current;
            expect(model.notifications.type).toBe('Failure');
        });

        it('should mark notification as read via backend API', async () => {
            const existingNotification: AppNotification = {
                id: '1',
                title: 'Test Notification',
                message: 'Test message',
                type: 'info',
                status: 'pending',
                createdAt: new Date().toISOString(),
            };

            const updatedNotification: AppNotification = {
                ...existingNotification,
                status: 'read',
                readAt: new Date().toISOString(),
            };

            // 1. Initial fetch mock
            fetchMock.mockResponseOnce(JSON.stringify({
                results: [existingNotification],
                count: 1,
                next: null,
                previous: null,
            }));

            // 2. Patch update mock
            fetchMock.mockResponseOnce(JSON.stringify(updatedNotification));

            const { result } = renderHook(() => useNotificationStore());

            // Load notifications
            await act(async () => {
                result.current.dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            // Mark as read
            await act(async () => {
                result.current.dispatch(MARK_AS_READ_REQUESTED('1'));
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(fetchMock.mock.calls[1][0]).toContain('/api/notifications/1/read/');
            expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH');

            const { model } = result.current;
            expect(model.allNotifications.find(n => n.id === '1')?.status).toBe('read');
        });

        it('should mark all notifications as read via backend API', async () => {
            const notifications: AppNotification[] = [
                { id: '1', title: 'P1', message: 'M1', type: 'info', status: 'pending', createdAt: new Date().toISOString() },
                { id: '2', title: 'P2', message: 'M2', type: 'info', status: 'pending', createdAt: new Date().toISOString() },
            ];

            fetchMock.mockResponseOnce(JSON.stringify({ results: notifications, count: 2 }));
            fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success', count: 2 }));

            const { result } = renderHook(() => useNotificationStore());

            await act(async () => {
                result.current.dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            await act(async () => {
                result.current.dispatch(MARK_ALL_AS_READ_REQUESTED());
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(fetchMock.mock.calls[1][0]).toContain('/api/notifications/mark-all-read/');
            expect(fetchMock.mock.calls[1][1]?.method).toBe('POST');

            const { model } = result.current;
            expect(model.unreadCount).toBe(0);
        });

        it('should handle network errors gracefully', async () => {
            fetchMock.mockReject(new Error('Network error'));

            const { result } = renderHook(() => useNotificationStore());

            await act(async () => {
                result.current.dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const { model } = result.current;
            expect(model.notifications.type).toBe('Failure');
        });
    });

    describe('Performance and Edge Cases', () => {
        it('should handle empty response from API', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ results: [], count: 0 }));

            const { result } = renderHook(() => useNotificationStore());

            await act(async () => {
                result.current.dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const { model } = result.current;
            expect(model.notifications.type).toBe('Success');
            if (model.notifications.type === 'Success') {
                expect(model.notifications.data).toEqual([]);
            }
        });

        it('should handle malformed API responses', async () => {
            fetchMock.mockResponseOnce('not json');

            const { result } = renderHook(() => useNotificationStore());

            await act(async () => {
                result.current.dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const { model } = result.current;
            expect(model.notifications.type).toBe('Failure');
        });
    });
});
