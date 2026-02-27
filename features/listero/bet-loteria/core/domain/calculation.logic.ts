import { LoteriaSummary } from '../feature.types';
import { LoteriaBet } from '@/types';

/**
 * 🧮 CALCULATION LOGIC
 * Pure mathematical functions for summaries, totals, and stats.
 */
export const CalculationLogic = {
    /**
     * Calculates the summary object from a list of bets.
     * This is the single source of truth for "How much money is in the ticket".
     * 
     * @param bets The current list of bets
     * @param currentSummary The current summary state to preserve other fields
     * @param fixedAmount Optional fixed amount per bet from rules
     */
    calculateSummary: (
        bets: LoteriaBet[],
        currentSummary: LoteriaSummary,
        fixedAmount: number | null = null
    ): LoteriaSummary => {
        const total = bets.reduce((sum, b) => {
            // Prefer fixedAmount if available (not null and > 0)
            const amount = (fixedAmount !== null && fixedAmount > 0)
                ? fixedAmount
                : (b.amount || 0);
            return sum + amount;
        }, 0);

        return {
            ...currentSummary,
            loteriaTotal: total,
            hasBets: bets.length > 0
        };
    },

    /**
     * Generates a unique ID for new bets.
     * Abstracted to allow for deterministic testing if needed.
     */
    generateId: (): string => Date.now().toString(),

    /**
     * Generates a random receipt code for the ticket.
     * Format: 5 uppercase alphanumeric characters.
     */
    generateReceiptCode: (): string => {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    }
};
