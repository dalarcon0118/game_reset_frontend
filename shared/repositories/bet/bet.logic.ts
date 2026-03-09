import { BetDomainModel } from './bet.types';

/**
 * Pure logic for bet maintenance.
 * No side effects, just data transformation.
 */
export const BetLogic = {
    /**
     * Identifies bets that should be blocked (older than 24h).
     */
    applyBlockingPolicy(bets: BetDomainModel[], now: number): { updated: BetDomainModel[], changes: number } {
        let changes = 0;
        const updated = bets.map(bet => {
            const isOld = now - bet.timestamp > 86400000; // 24h
            if (isOld && bet.status === 'pending') {
                changes++;
                return { ...bet, status: 'blocked' as const };
            }
            return bet;
        });
        return { updated, changes };
    },

    /**
     * Resets blocked bets to pending (midnight reset logic).
     */
    applyMidnightReset(bets: BetDomainModel[]): { updated: BetDomainModel[], changes: number } {
        let changes = 0;
        const updated = bets.map(bet => {
            if (bet.status === 'blocked') {
                changes++;
                return { ...bet, status: 'pending' as const };
            }
            return bet;
        });
        return { updated, changes };
    },

    /**
     * Checks if the app should be blocked based on pending bets.
     */
    isAppBlocked(bets: BetDomainModel[]): { blocked: boolean; blockedBetsCount: number } {
        const blockedBets = bets.filter(b => b.status === 'blocked');
        return {
            blocked: blockedBets.length > 0,
            blockedBetsCount: blockedBets.length
        };
    },

    /**
     * Generates a random receipt code for grouping bets.
     * Format: 5 uppercase alphanumeric characters.
     */
    generateReceiptCode(): string {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    }
};
