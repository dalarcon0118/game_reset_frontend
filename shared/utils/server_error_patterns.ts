export const SERVER_ERROR_PATTERNS = {
    DEVICE_LOCKED: 'DEVICE_LOCKED',
    MISMATCH_DETECTED: 'Mismatch detected',
    USER_ID_PREFIX: 'user_id=',
    INCOMING_PREFIX: 'incoming=',
    STORED_PREFIX: 'stored=',
} as const;

export const isServerSpecificErrorMessage = (message: string): boolean => {
    if (!message) return false;

    const patterns = [
        SERVER_ERROR_PATTERNS.DEVICE_LOCKED,
        SERVER_ERROR_PATTERNS.MISMATCH_DETECTED,
        SERVER_ERROR_PATTERNS.USER_ID_PREFIX,
        SERVER_ERROR_PATTERNS.INCOMING_PREFIX,
        SERVER_ERROR_PATTERNS.STORED_PREFIX
    ];

    return patterns.some(pattern => message.includes(pattern));
};