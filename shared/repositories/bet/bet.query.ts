import { ListBetsFilters } from '@/shared/services/bet/types';
import { toUtcISODate } from '@/shared/utils/formatters';

/**
 * Fluent API Builder for Bet Filters.
 * Ensures consistent date formatting and type safety across the application.
 */
export class BetQuery {
    private filters: ListBetsFilters = {};

    private constructor() { }

    /**
     * Creates a new BetQuery instance.
     */
    static create(): BetQuery {
        return new BetQuery();
    }

    /**
     * Filters by Draw ID.
     */
    forDraw(drawId: string | number): this {
        this.filters.drawId = String(drawId);
        return this;
    }

    /**
     * Filters by specific date (YYYY-MM-DD).
     */
    onDate(date: string | Date): this {
        this.filters.date = date instanceof Date
            ? toUtcISODate(date.getTime())
            : date;
        return this;
    }

    /**
     * Filters by Receipt Code.
     */
    withReceiptCode(receiptCode: string): this {
        this.filters.receiptCode = receiptCode;
        return this;
    }

    /**
     * Builds the final filters object.
     */
    build(): ListBetsFilters {
        return { ...this.filters };
    }
}
