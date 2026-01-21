import { DrawType } from '@/types';

export type StatusFilter = 'all' | 'open' | 'closed' | 'closing_soon' | 'rewarded';

export interface DailyTotals {
    totalCollected: number;
    premiumsPaid: number;
    netResult: number;
    estimatedCommission: number;
    amountToRemit: number;
}

export const isClosingSoon = (bettingEndTime?: string) => {
    if (!bettingEndTime) return false;
    const now = new Date();
    const endTime = new Date(bettingEndTime);
    const diff = endTime.getTime() - now.getTime();
    return diff > 0 && diff < 5 * 60 * 1000; // 5 minutes according to feature spec
};

export const isExpired = (draw: DrawType) => {
    // If backend says it's open, it's not expired, regardless of time
    if (draw.is_betting_open === true) return false;

    if (!draw.betting_end_time) return false;
    const now = new Date();
    const endTime = new Date(draw.betting_end_time);
    return now.getTime() >= endTime.getTime();
};
