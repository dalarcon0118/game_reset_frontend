import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd, ret, singleton } from '@core/tea-utils';
import { Model } from './model';
import { Msg, FETCH_NOTIFICATIONS_REQUESTED } from './msg';
import { update, subscriptions } from './update';

/**
 * 🛠️ INITIAL MODEL
 */
export const initialNotificationModel: Model = {
    notifications: { type: 'NotAsked' },
    preferences: {
        enablePushNotifications: true,
        enableEmailNotifications: false,
        enableInAppNotifications: true,
    },
    selectedNotification: null,
    currentFilter: 'all',
    allNotifications: [],
};

/**
 * 🏗️ NOTIFICATION MODULE DEFINITION
 * Pure TEA definition using the formal pattern.
 */
export const notificationDefinition = defineTeaModule<Model, Msg>({
    name: 'Notification',
    initial: () => {
        // No disparamos comandos iniciales. 
        // Esperamos a que la suscripción de sesión detecte un usuario válido.
        return singleton(initialNotificationModel);
    },
    update,
    subscriptions
});

/**
 * 🏪 NOTIFICATION MODULE INSTANCE
 * Result of createTEAModule, providing Provider and hooks.
 */
export const NotificationModule = createTEAModule(notificationDefinition);

// Hook exports for easier access
export const useNotificationStore = NotificationModule.useStore;
export const useNotificationDispatch = NotificationModule.useDispatch;

// Selectors
export const selectNotificationModel = (state: { model: Model }) => state.model;
export const selectNotificationDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
