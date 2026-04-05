import { OfflineStorageKeyManager } from '../../core/offline-storage/utils';
import { AUTH_KEYS } from './auth.constants';

/**
 * Helpers para la generación de llaves de almacenamiento offline para Autenticación.
 */
export const AuthOfflineKeys = {
    /**
     * Llave para el perfil de usuario actual
     */
    userProfile: () =>
        OfflineStorageKeyManager.generateKey(AUTH_KEYS.STORAGE_ENTITY, 'user', AUTH_KEYS.USER_PROFILE, AUTH_KEYS.DATA_TYPE),

    /**
     * Llave para el perfil usado en validación offline persistente
     */
    offlineProfile: () =>
        OfflineStorageKeyManager.generateKey(AUTH_KEYS.STORAGE_ENTITY, 'user', AUTH_KEYS.OFFLINE_PROFILE, AUTH_KEYS.DATA_TYPE),

    /**
     * Llave para el hash del PIN (usado en login offline)
     */
    pinHash: () =>
        OfflineStorageKeyManager.generateKey(AUTH_KEYS.STORAGE_ENTITY, 'user', AUTH_KEYS.PIN_HASH, AUTH_KEYS.DATA_TYPE),

    /**
     * Llave para el último nombre de usuario que inició sesión
     */
    lastUsername: () =>
        OfflineStorageKeyManager.generateKey(AUTH_KEYS.STORAGE_ENTITY, 'user', AUTH_KEYS.LAST_USERNAME, AUTH_KEYS.DATA_TYPE),
};
