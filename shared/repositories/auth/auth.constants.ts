/**
 * Constantes y Textos para el Módulo de Autenticación (Auth)
 */

export const AUTH_KEYS = {
    STORAGE_ENTITY: 'auth',
    USER_PROFILE: 'profile',
    OFFLINE_PROFILE: 'offline_profile',
    PIN_HASH: 'pin_hash',
    LAST_USERNAME: 'last_username',
    DATA_TYPE: 'data',

    // Secure Storage Keys
    SECURE_ACCESS_TOKEN: 'auth_access_token',
    SECURE_REFRESH_TOKEN: 'auth_refresh_token',
    SECURE_CONFIRMATION_TOKEN: 'auth_confirmation_token',
    SECURE_DAILY_SECRET: 'auth_daily_secret',
    SECURE_OFFLINE_TOKEN: 'offline-token',
};

export const AUTH_LOG_TAGS = {
    API_ADAPTER: 'AUTH_API_ADAPTER',
    STORAGE_ADAPTER: 'AUTH_STORAGE_ADAPTER',
    API_V2: 'AUTH_API_V2',
};

export const AUTH_LOGS = {
    // API Adapter
    LOGIN_ATTEMPT: 'Intentando login online',
    LOGIN_FAILED: 'Solicitud de login online fallida',
    LOGIN_INVALID_RESPONSE: 'Respuesta de login inválida: falta token o usuario',
    LOGIN_AUTH_ERROR: 'Error de autenticación',

    REFRESH_ATTEMPT: 'Intentando refrescar token',
    REFRESH_FAILED: 'Fallo al refrescar token',
    REFRESH_INVALID_RESPONSE: 'Respuesta de refresh inválida: falta token',
    REFRESH_ERROR: 'Error al refrescar token',

    VALIDATION_FAILED: 'Fallo en la validación de la respuesta',

    // Storage Adapter
    SESSION_PERSISTED: 'Sesión persistida exitosamente',
    SESSION_PERSIST_ERROR: 'Error al persistir la sesión',
    SESSION_READ_ERROR: 'Error al leer la sesión',
    SESSION_CLEARED: 'Sesión eliminada',
    SESSION_CLEAR_ERROR: 'Error al eliminar la sesión',

    OFFLINE_CREDENTIALS_UPDATED: 'Credenciales offline actualizadas',
    OFFLINE_CREDENTIALS_ERROR: 'Error al guardar credenciales offline',
    OFFLINE_VAL_SUCCESS: 'Validación offline exitosa',
    OFFLINE_VAL_FAILED: 'Validación offline fallida',
    OFFLINE_VAL_ERROR: 'Error durante la validación offline',
    OFFLINE_VAL_INVALID: 'Credenciales inválidas o no disponibles offline',
    OFFLINE_VAL_LOCAL_ERROR: 'Error en la validación local',

    CHECKING_LAST_USER: 'Verificando último usuario',
    FALLBACK_OFFLINE_PROFILE: 'Uso de perfil offline como respaldo para el nombre de usuario',

    PURGE_LEGACY_DATA: 'Datos de identidad de dispositivo heredados eliminados',
    PURGE_LEGACY_ERROR: 'Error al eliminar datos heredados (posiblemente ya no existen)',
};
