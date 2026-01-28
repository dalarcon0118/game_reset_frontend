import { loadFeature, defineFeature } from 'jest-cucumber';
import { useNotificationStore } from '../../../features/notification/core/store';
import { useAuthStore } from '../../../features/auth/store/store';
import { AuthMsgType } from '../../../features/auth/store/types';
import {
    FETCH_NOTIFICATIONS_REQUESTED,
    MARK_AS_READ_REQUESTED,
    RESET_STATE
} from '../../../features/notification/core/msg';
import { NotificationService } from '../../../shared/services/notification_service';

const feature = loadFeature('./tests/features/notification/notification.feature');

defineFeature(feature, (test) => {
    test('Flujo completo de integración de notificaciones', ({ given, when, then, and }) => {
        given('un usuario autenticado en el sistema', async () => {
            console.log('--- Attempting login for juan ---');
            const { dispatch, model } = useAuthStore.getState();
            if (model.isAuthenticated) {
                console.log('Already authenticated');
                return;
            }

            dispatch({
                type: AuthMsgType.LOGIN_REQUESTED,
                username: 'juan',
                pin: '123456'
            });

            console.log('--- Auth Store State BEFORE login dispatch ---', JSON.stringify(useAuthStore.getState().model, null, 2));

            let attempts = 0;
            while (!useAuthStore.getState().model.isAuthenticated && attempts < 100) {
                if (attempts % 10 === 0) {
                    console.log(`Waiting for auth... attempt ${attempts}`);
                    console.log('Current state:', JSON.stringify(useAuthStore.getState().model, null, 2));
                }
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (!useAuthStore.getState().model.isAuthenticated) {
                const error = useAuthStore.getState().model.error;
                console.error('Authentication failed:', error);
            }

            expect(useAuthStore.getState().model.isAuthenticated).toBe(true);
            console.log('Authentication successful for juan');

            // Wait a bit for tokens to sync to other stores
            await new Promise(resolve => setTimeout(resolve, 1000));
        });

        and('el sistema de notificaciones está inicializado', () => {
            const { dispatch } = useNotificationStore.getState();
            dispatch(RESET_STATE());
        });

        when('disparo una nueva notificación desde el backend para este usuario', async () => {
            const newNotif = await NotificationService.createNotification({
                title: 'E2E Test Notification',
                message: 'This is a real integration test notification',
                type: 'info',
                status: 'pending'
            });
            expect(newNotif).toBeDefined();
            (global as any).lastCreatedNotificationId = newNotif.id;
        });

        and('despacho el comando "FETCH_NOTIFICATIONS_REQUESTED" en el store de TEA', async () => {
            const { dispatch } = useNotificationStore.getState();
            dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        then('el estado de las notificaciones debe ser eventualmente "Success"', async () => {
            let attempts = 0;
            while (useNotificationStore.getState().model.notifications.type !== 'Success' && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            expect(useNotificationStore.getState().model.notifications.type).toBe('Success');
        });

        and('la lista de notificaciones debe contener la nueva notificación disparada', () => {
            const { model } = useNotificationStore.getState();
            if (model.notifications.type === 'Success') {
                const found = model.notifications.data.find(n => n.id === (global as any).lastCreatedNotificationId);
                expect(found).toBeDefined();
            }
        });

        when('despacho el comando "MARK_AS_READ_REQUESTED" para la notificación recibida', async () => {
            const { dispatch } = useNotificationStore.getState();
            dispatch(MARK_AS_READ_REQUESTED((global as any).lastCreatedNotificationId));
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        then('el estado local debe actualizarse a "read"', () => {
            const { model } = useNotificationStore.getState();
            if (model.notifications.type === 'Success') {
                const found = model.notifications.data.find(n => n.id === (global as any).lastCreatedNotificationId);
                expect(found?.status).toBe('read');
            }
        });

        and('una nueva petición de lista debe confirmar que la notificación está "read" en el backend', async () => {
            const { dispatch } = useNotificationStore.getState();
            dispatch(FETCH_NOTIFICATIONS_REQUESTED());
            let attempts = 0;
            while (useNotificationStore.getState().model.notifications.type !== 'Success' && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            const { model } = useNotificationStore.getState();
            if (model.notifications.type === 'Success') {
                const found = model.notifications.data.find(n => n.id === (global as any).lastCreatedNotificationId);
                expect(found?.status).toBe('read');
            }
        });
    }, 30000);

    test('Recepción de notificaciones en tiempo real vía SSE', ({ given, when, then, and }) => {
        given('un usuario autenticado en el sistema', async () => {
            const { dispatch, model } = useAuthStore.getState();
            if (model.isAuthenticated) return;

            dispatch({
                type: AuthMsgType.LOGIN_REQUESTED,
                username: 'juan',
                pin: '123456'
            });

            let attempts = 0;
            while (!useAuthStore.getState().model.isAuthenticated && attempts < 100) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            expect(useAuthStore.getState().model.isAuthenticated).toBe(true);
        });

        and('el sistema de notificaciones está suscrito al stream de eventos en tiempo real', () => {
            // Esto se verificará indirectamente cuando llegue el mensaje
            const { dispatch } = useNotificationStore.getState();
            dispatch(RESET_STATE());
        });

        when('disparo una nueva notificación desde el backend para este usuario', async () => {
            const newNotif = await NotificationService.createNotification({
                title: 'Real-time SSE Notification',
                message: 'This should arrive via SSE',
                type: 'success',
                status: 'pending'
            });
            expect(newNotif).toBeDefined();
            (global as any).lastCreatedNotificationId = newNotif.id;
        });

        then('la notificación debe aparecer automáticamente en el store de TEA sin refresco manual', async () => {
            let attempts = 0;
            let found = false;

            while (!found && attempts < 50) {
                const { model } = useNotificationStore.getState();
                found = model.allNotifications.some(n => n.id === (global as any).lastCreatedNotificationId);
                if (!found) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }
            }

            expect(found).toBe(true);
        });

        and('el contador de notificaciones no leídas debe incrementarse automáticamente', () => {
            const { model } = useNotificationStore.getState();
            expect(model.unreadCount).toBeGreaterThan(0);
        });
    }, 30000);
});
