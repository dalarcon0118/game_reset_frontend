import { DrawType } from '@/types';

export type StatusFilter = 'all' | 'open' | 'closed' | 'closing_soon' | 'rewarded' | 'scheduled';

export interface DailyTotals {
    totalCollected: number;
    premiumsPaid: number;
    netResult: number;
    estimatedCommission: number;
    amountToRemit: number;
}

export const isClosingSoon = (bettingEndTime?: string | null) => {
    if (!bettingEndTime) return false;
    const now = new Date();
    const endTime = new Date(bettingEndTime);
    const diff = endTime.getTime() - now.getTime();
    return diff > 0 && diff < 5 * 60 * 1000; // 5 minutes according to feature spec
};

export const isExpired = (draw: DrawType) => {
    // 1. Prioritize official server status
    if (draw.status === 'closed' || draw.status === 'completed') return true;
    if (draw.status === 'open') return false;

    // 2. Fallback to is_betting_open flag
    if (draw.is_betting_open === true) return false;
    if (draw.is_betting_open === false) return true;

    // 3. Last resort: time-based check
    if (!draw.betting_end_time) return false;
    const now = new Date();
    const endTime = new Date(draw.betting_end_time);
    return now.getTime() >= endTime.getTime();
};
