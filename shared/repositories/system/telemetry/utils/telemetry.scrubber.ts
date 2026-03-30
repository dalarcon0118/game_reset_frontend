/**
 * Utility to scrub sensitive information from telemetry data before it is stored or sent.
 * Prevents PII (Personally Identifiable Information) and credentials leakage.
 */
export class TelemetryScrubber {
    private static readonly SENSITIVE_KEYS = [
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'auth',
        'authorization',
        'cvv',
        'creditCard',
        'cardNumber',
        'pin',
        'secret',
        'privateKey',
        'apiKey',
        'session'
    ];

    /**
     * Deeply scrubs an object or value.
     */
    static scrub(data: any): any {
        if (data === null || data === undefined) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.scrub(item));
        }

        if (typeof data === 'object') {
            const scrubbed: Record<string, any> = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    if (this.isSensitiveKey(key)) {
                        scrubbed[key] = '[REDACTED]';
                    } else {
                        scrubbed[key] = this.scrub(data[key]);
                    }
                }
            }
            return scrubbed;
        }

        return data;
    }

    private static isSensitiveKey(key: string): boolean {
        const normalizedKey = key.toLowerCase();
        return this.SENSITIVE_KEYS.some(sensitiveKey => 
            normalizedKey.includes(sensitiveKey.toLowerCase())
        );
    }
}
