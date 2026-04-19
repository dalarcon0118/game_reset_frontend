export const AUTH_MESSAGES = {
    OFFLINE_LOGIN_DENIED_NO_DRAWS: 'La aplicación no pudo cargar los sorteos disponibles desde el servidor',
    TIME_INTEGRITY_VIOLATION: 'Integridad de tiempo violada. Por favor sincronice su reloj o conecte a internet.',
    OFFLINE_CONDITION_CHECKER_MISSING: 'Sistema no puede verificar condiciones offline. Conecte a internet.',
    OFFLINE_USER_NO_STRUCTURE: 'Usuario sin estructura asignada. No puede hacer login offline.',
    OFFLINE_NO_DRAWS_FOR_STRUCTURE: 'No hay sorteos disponibles para su estructura. Conecte a internet.',
    UNEXPECTED_ERROR: 'Error inesperado en el sistema',
    CONNECTION_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
    ACCOUNT_LOCKED: 'Tu cuenta está bloqueada. Contacta al administrador.',
    ACCOUNT_DISABLED: 'Tu cuenta está desactivada. Contacta al administrador.',
    DEVICE_LOCKED: 'Este usuario ya está vinculado a otro dispositivo.',
    DEVICE_ID_REQUIRED: 'Se requiere identificación de dispositivo.',
    SERVER_ERROR: 'Error interno del servidor. Por favor, intenta más tarde.',
    INVALID_CREDENTIALS: 'Credenciales inválidas. Verifica tu usuario y PIN.',
    INVALID_PIN: 'El PIN ingresado es incorrecto.',
    USER_NOT_FOUND: (username: string) => `El usuario "${username}" no existe. Verifica el nombre de usuario.`,
    RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
