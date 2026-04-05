/**
 * Constantes y Textos para el Módulo Criptográfico
 */

export const CRYPTO_KEYS = {
    DEVICE_SECRET: 'FINGERPRINT_DEVICE_SECRET',
    LAST_HASH: 'FINGERPRINT_LAST_HASH',
    TIME_ANCHOR: 'FINGERPRINT_TIME_ANCHOR',
};

export const CRYPTO_VALUES = {
    GENESIS_HASH: '0'.repeat(64),
    VERSION: 2, // V2: Zero Trust Running Balance
};

export const CRYPTO_LOG_TAGS = {
    DEVICE_SECRET: 'DEVICE_SECRET_REPO',
    FINGERPRINT: 'FINGERPRINT_REPO',
    HASH_CHAIN: 'HASH_CHAIN_REPO',
    TIME_ANCHOR: 'TIME_ANCHOR_REPO',
};

export const CRYPTO_MESSAGES = {
    DEVICE_SECRET_GENERATED: 'Nuevo device secret generado',
    DEVICE_SECRET_REGISTERED: 'Device secret registrado en el backend exitosamente',
    DEVICE_SECRET_NOT_FOUND: 'Secret not found in SecureStore',
    DEVICE_SECRET_REGISTRATION_ERROR: 'Error al registrar device secret',
    
    HASH_CHAIN_ERROR: 'Error encadenando hash',
    HASH_CHAIN_RESET: 'Hash Chain reseteada al Genesis',
    
    TIME_ANCHOR_SYNCED: 'Time anchor sincronizado y almacenado',
    TIME_ANCHOR_EXPIRED: 'Time anchor expirado. Requiere nueva conexión.',
    TIME_ANCHOR_REBOOT: 'Reinicio detectado: monotonicDelta negativo',
    TIME_ANCHOR_DRIFT: 'Drift temporal detectado. Posible manipulación.',
    TIME_ANCHOR_PARSE_ERROR: 'Error parseando time anchor',
};

export const TIME_ANCHOR_ERRORS = {
    NO_ANCHOR_FOUND: 'NO_ANCHOR_FOUND',
    ANCHOR_EXPIRED: 'ANCHOR_EXPIRED',
    REBOOT_DETECTED: 'REBOOT_DETECTED',
    DRIFT_DETECTED: 'DRIFT_DETECTED',
} as const;
