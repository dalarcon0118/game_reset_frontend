/**
 * Financial Domain Models (CQRS Pattern)
 * Pure projections calculated from BetType (source of truth).
 */

export interface DrawFinancial {
    drawId: string;
    drawStatus?: string;
    totalCollected: number;
    betCount: number;
    premiumsPaid: number;
    netResult: number;
}

export interface BetTypeFinancial {
    betTypeId: number;
    betTypeCode?: string;
    totalCollected: number;
    betCount: number;
}

export interface FinancialProjection {
    calculatedAt: number;
    structureId: string;
    date: string;
    totalCollected: number;
    premiumsPaid: number;
    estimatedCommission: number;
    netResult: number;
    amountToRemit: number;
    betCount: number;
    byDrawId: Record<string, DrawFinancial>;
    byBetType: Record<string, BetTypeFinancial>;
}

export interface DailyTotals {
    totalCollected: number;
    premiumsPaid: number;
    estimatedCommission: number;
    netResult: number;
    amountToRemit: number;
    betCount: number;
}
