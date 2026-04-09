export const AUTH_MESSAGES = {
    OFFLINE_LOGIN_DENIED_NO_DRAWS: 'La aplicación no pudo cargar los sorteos disponibles desde el servidor',
    TIME_INTEGRITY_VIOLATION: 'Integridad de tiempo violada. Por favor sincronice su reloj o conecte a internet.',
    OFFLINE_CONDITION_CHECKER_MISSING: 'Sistema no puede verificar condiciones offline. Conecte a internet.',
    OFFLINE_USER_NO_STRUCTURE: 'Usuario sin estructura asignada. No puede hacer login offline.',
    OFFLINE_NO_DRAWS_FOR_STRUCTURE: 'No hay sorteos disponibles para su estructura. Conecte a internet.',
    UNEXPECTED_ERROR: 'Error inesperado en el sistema',
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
