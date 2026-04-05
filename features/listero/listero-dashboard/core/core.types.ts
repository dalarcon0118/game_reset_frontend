import { DrawType, DRAW_STATUS } from '@/types';

export const DRAW_FILTER = {
    ALL: 'all',
    OPEN: 'open',
    CLOSED: 'closed',
    CLOSING_SOON: 'closing_soon',
    REWARDED: 'rewarded',
    SCHEDULED: 'scheduled',
} as const;

export type StatusFilter = typeof DRAW_FILTER[keyof typeof DRAW_FILTER];

export interface DailyTotals {
    totalCollected: number;
    premiumsPaid: number;
    netResult: number;
    estimatedCommission: number;
    amountToRemit: number;
}

export const isClosingSoon = (bettingEndTime: string | null | undefined, now: number) => {
    if (!bettingEndTime) return false;
    const endTime = new Date(bettingEndTime).getTime();
    const diff = endTime - now;
    return diff > 0 && diff < 5 * 60 * 1000; // 5 minutes according to feature spec
};

export const isExpired = (draw: DrawType, now: number) => {
    // OFFLINE-FIRST: El tiempo es la fuente de verdad, no el status del backend
    // 1. Verificar tiempo primero
    if (draw.betting_end_time) {
        const endTime = new Date(draw.betting_end_time).getTime();
        if (now >= endTime) {
            return true;
        }
    }

    // 2. Estados definitively cerrados por el servidor
    if (
        draw.status === DRAW_STATUS.CLOSED ||
        draw.status === DRAW_STATUS.COMPLETED ||
        draw.status === DRAW_STATUS.REWARDED
    ) return true;

    // 3. Si is_betting_open es explicitamente true, no ha expirado
    if (draw.is_betting_open === true) return false;

    // 4. Por tiempo ya se verificó arriba
    return false;
};
