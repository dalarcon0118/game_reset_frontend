export const SERVER_ERROR_PATTERNS = {
    DEVICE_LOCKED: 'DEVICE_LOCKED',
    MISMATCH_DETECTED: 'Mismatch detected',
    USER_ID_PREFIX: 'user_id=',
    INCOMING_PREFIX: 'incoming=',
    STORED_PREFIX: 'stored=',
    // Patrones para errores de base de datos
    DB_CONNECTION_ERROR: 'Connection refused',
    DB_HOST: 'host.docker.internal',
    DB_PORT: 'port 543',
    OPERATIONAL_ERROR: 'OperationalError',
    DB_DETAIL: 'No se puede conectar a la base de datos',
    DATABASE: 'database',
} as const;

export const isServerSpecificErrorMessage = (message: string): boolean => {
    if (!message) return false;

    const patterns = [
        SERVER_ERROR_PATTERNS.DEVICE_LOCKED,
        SERVER_ERROR_PATTERNS.MISMATCH_DETECTED,
        SERVER_ERROR_PATTERNS.USER_ID_PREFIX,
        SERVER_ERROR_PATTERNS.INCOMING_PREFIX,
        SERVER_ERROR_PATTERNS.STORED_PREFIX,
        // Agregar patrones de base de datos
        SERVER_ERROR_PATTERNS.DB_CONNECTION_ERROR,
        SERVER_ERROR_PATTERNS.DB_HOST,
        SERVER_ERROR_PATTERNS.DB_PORT,
        SERVER_ERROR_PATTERNS.OPERATIONAL_ERROR,
        SERVER_ERROR_PATTERNS.DB_DETAIL,
    ];

    return patterns.some(pattern => message.includes(pattern));
};
