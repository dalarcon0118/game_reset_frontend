import { OfflineStorageKeyManager } from '../../core/offline-storage/utils';

/**
 * Helpers para la generación de llaves de almacenamiento offline para Autenticación.
 */
export const AuthOfflineKeys = {
    /**
     * Llave para el perfil de usuario actual
     */
    userProfile: () =>
        OfflineStorageKeyManager.generateKey('auth', 'user', 'profile', 'data'),

    /**
     * Llave para el hash del PIN (usado en login offline)
     */
    pinHash: () =>
        OfflineStorageKeyManager.generateKey('auth', 'user', 'pin_hash', 'data'),

    /**
     * Llave para el último nombre de usuario que inició sesión
     */
    lastUsername: () =>
        OfflineStorageKeyManager.generateKey('auth', 'user', 'last_username', 'data'),
};
