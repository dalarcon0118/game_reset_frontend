import { Model, AppNotification } from './model';

export const selectUnreadCount = (model: Model): number => {
    const notifications = model.allNotifications || [];
    return notifications.filter(n => n.status === 'pending').length;
};

export const selectFilteredNotifications = (model: Model): AppNotification[] => {
    const notifications = model.allNotifications || [];
    switch (model.currentFilter) {
        case 'pending': return notifications.filter(n => n.status === 'pending');
        case 'read': return notifications.filter(n => n.status === 'read');
        default: return notifications;
    }
};

export const selectNotificationById = (model: Model, id: string): AppNotification | undefined => {
    return (model.allNotifications || []).find(n => n.id === id);
};