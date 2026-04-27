import { logger } from '@/shared/utils/logger';

const log = logger.withTag('CommissionRate');

export class InvalidCommissionRateError extends Error {
    constructor(value: unknown) {
        super(`Invalid commission rate: ${value}`);
        this.name = 'InvalidCommissionRateError';
    }
}

export class CommissionRate {
    private readonly _value: number;
    private readonly _original: unknown;

    private constructor(value: number, original: unknown) {
        this._value = value;
        this._original = original;
    }

    get value(): number {
        return this._value;
    }

    get original(): unknown {
        return this._original;
    }

    static create(raw: unknown): CommissionRate {
        if (raw instanceof CommissionRate) {
            return raw;
        }

        const parsed = this.parse(raw);
        const normalized = this.normalize(parsed, raw);

        if (!this.isValid(normalized)) {
            log.warn('[DDD_FAIL_FAST] Invalid commission rate, using 0', { raw });
            return new CommissionRate(0, raw);
        }

        return new CommissionRate(normalized, raw);
    }

    static createUnsafe(raw: unknown): CommissionRate {
        if (raw instanceof CommissionRate) {
            return raw;
        }

        const parsed = this.parse(raw);
        const normalized = this.normalize(parsed, raw);

        if (!this.isValid(normalized)) {
            throw new InvalidCommissionRateError(raw);
        }

        return new CommissionRate(normalized, raw);
    }

    private static parse(raw: unknown): number {
        if (raw === undefined) {
            log.debug('[COMMISSION_RATE_PARSE] raw is undefined, defaulting to 0');
            return 0;
        }
        if (raw === null) {
            log.debug('[COMMISSION_RATE_PARSE] raw is null, defaulting to 0');
            return 0;
        }
        if (typeof raw === 'number' && !isNaN(raw)) {
            return raw;
        }
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (trimmed === '') {
                log.debug('[COMMISSION_RATE_PARSE] raw is empty string, defaulting to 0');
                return 0;
            }
            const parsed = parseFloat(trimmed);
            if (isNaN(parsed)) {
                log.warn('[COMMISSION_RATE_PARSE] string could not be parsed', { raw, trimmed });
                return 0;
            }
            return parsed;
        }
        log.warn('[COMMISSION_RATE_PARSE] unexpected type, defaulting to 0', {
            raw,
            type: typeof raw
        });
        return 0;
    }

    private static normalize(value: number, original: unknown): number {
        if (value === 0) return 0;
        if (value > 1) {
            log.debug('[COMMISSION_RATE_NORMALIZE] value > 1, dividing by 100', {
                original,
                before: value,
                after: value / 100
            });
            return value / 100;
        }
        return value;
    }

    private static isValid(value: number): boolean {
        const valid = value >= 0 && value <= 1;
        if (!valid) {
            log.warn('[COMMISSION_RATE_VALIDATION] value out of range', {
                value,
                min: 0,
                max: 1
            });
        }
        return valid;
    }

    equals(other: CommissionRate): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return `${(this._value * 100).toFixed(2)}%`;
    }

    toDecimal(): number {
        return this._value;
    }
}

export const createCommissionRate = (raw: unknown): number => {
    return CommissionRate.create(raw).value;
};

export const createCommissionRateUnsafe = (raw: unknown): number => {
    return CommissionRate.createUnsafe(raw).value;
};
