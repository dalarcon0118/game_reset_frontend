import { OfflineStorageKeyManager } from '@core/offline-storage/utils';

/**
 * Helpers para la generación de llaves de almacenamiento offline del dominio de Notificaciones.
 * Soporta multi-tenancy incluyendo el userId para asegurar aislamiento entre sesiones.
 */
export const NotificationOfflineKeys = {
    /**
     * Llave para los datos de una notificación individual persistida.
     * Estructura: @v2:notification:inbox:<userId>:<notificationId>
     */
    notification: (userId: string, notificationId: string) =>
        OfflineStorageKeyManager.generateKey('notification', `inbox:${userId}`, notificationId, 'data'),

    /**
     * Patrón para buscar todas las notificaciones del inbox de un usuario específico.
     */
    getPattern: (userId: string, notificationId: string = '*') =>
        OfflineStorageKeyManager.getPattern('notification', `inbox:${userId}`, notificationId, 'data'),

    /**
     * Llave para registrar notificaciones eliminadas localmente (Tombstones).
     * Evita que la reconciliación remota las resucite antes de sincronizar el borrado.
     */
    tombstone: (userId: string, notificationId: string) =>
        OfflineStorageKeyManager.generateKey('notification', `tombstones:${userId}`, notificationId, 'deleted'),

    /**
     * Llave para la cola de acciones de sincronización pendientes.
     */
    syncQueue: (userId: string, actionId: string) =>
        OfflineStorageKeyManager.generateKey('notification', `sync_queue:${userId}`, actionId, 'pending'),

    /**
     * Patrón para la cola de sincronización.
     */
    syncQueuePattern: (userId: string) =>
        OfflineStorageKeyManager.getPattern('notification', `sync_queue:${userId}`, '*', 'pending'),
};