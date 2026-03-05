/**
 * Normalizes any value into a proper Error object.
 * Useful for catching errors in catch blocks where the type is 'unknown'.
 */
export const ensureError = (error: any): Error => {
    if (error instanceof Error) return error;
    
    let message = String(error);
    
    if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof (error as any).message === 'string') {
            message = (error as any).message;
        } else if ('detail' in error && typeof (error as any).detail === 'string') {
            message = (error as any).detail;
        } else {
            try {
                const json = JSON.stringify(error);
                if (json !== '{}') {
                    message = json;
                } else if (message === '[object Object]') {
                    message = 'Unknown error';
                }
            } catch {
                // Ignore stringify errors
            }
        }
    }
    
    return new Error(message);
};
