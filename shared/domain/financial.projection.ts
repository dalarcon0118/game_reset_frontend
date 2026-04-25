/**
 * Financial Projection Calculator (CQRS Pattern)
 * Calculates financial projections from BetType (source of truth).
 * Fail-fast: Throws on invalid input to prevent silent errors.
 */

import { BetType } from '@/types';
import { FinancialProjection, DrawFinancial, BetTypeFinancial, DailyTotals } from './financial.types';

const isValidBet = (bet: BetType): boolean => {
    return bet.status === 'pending' || bet.status === 'synced';
};

export const calculateFinancialProjection = (
    pendingBets: BetType[],
    syncedBets: BetType[],
    premiumsByDraw: Record<string, number> = {},
    commissionRate: number = 0,
    structureId: string = ''
): FinancialProjection => {
    const safeRate = commissionRate > 1 ? commissionRate / 100 : commissionRate;
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    const allBets = [...pendingBets, ...syncedBets];
    const validBets = allBets.filter(isValidBet);

    if (validBets.length !== allBets.length) {
        const filtered = allBets.filter(b => !isValidBet);
        console.warn(`[FinancialProjection] Filtered ${filtered.length} invalid bets`);
    }

    let totalCollected = 0;
    let betCount = 0;
    const byDrawId: Record<string, DrawFinancial> = {};
    const byBetType: Record<string, BetTypeFinancial> = {};

    for (const bet of validBets) {
        const amount = Number(bet.amount) || 0;
        if (amount <= 0) {
            console.warn(`[FinancialProjection] Skipping bet with invalid amount`, { betId: bet.id, amount });
            continue;
        }

        const drawId = String(bet.drawId);
        const betTypeKey = String(bet.betTypeId);

        totalCollected += amount;
        betCount++;

        if (!byDrawId[drawId]) {
            byDrawId[drawId] = {
                drawId,
                totalCollected: 0,
                betCount: 0,
                premiumsPaid: premiumsByDraw[drawId] || 0,
                netResult: 0
            };
        }
        byDrawId[drawId].totalCollected += amount;
        byDrawId[drawId].betCount++;

        if (!byBetType[betTypeKey]) {
            byBetType[betTypeKey] = {
                betTypeId: Number(bet.betTypeId),
                betTypeCode: bet.betTypeCode,
                totalCollected: 0,
                betCount: 0
            };
        }
        byBetType[betTypeKey].totalCollected += amount;
        byBetType[betTypeKey].betCount++;
    }

    const totalPremiums = Object.values(byDrawId).reduce((sum, d) => sum + d.premiumsPaid, 0);
    const estimatedCommission = totalCollected * safeRate;
    const netResult = totalCollected - totalPremiums - estimatedCommission;

    for (const drawId of Object.keys(byDrawId)) {
        const draw = byDrawId[drawId];
        const drawCommission = draw.totalCollected * safeRate;
        draw.netResult = draw.totalCollected - draw.premiumsPaid - drawCommission;
    }

    return {
        calculatedAt: now,
        structureId,
        date: today,
        totalCollected,
        premiumsPaid: totalPremiums,
        estimatedCommission,
        netResult,
        amountToRemit: netResult,
        betCount,
        byDrawId,
        byBetType
    };
};

export const extractDailyTotals = (
    projection: FinancialProjection,
    commissionRate: number
): DailyTotals => {
    return {
        totalCollected: projection.totalCollected,
        premiumsPaid: projection.premiumsPaid,
        estimatedCommission: projection.estimatedCommission,
        netResult: projection.netResult,
        amountToRemit: projection.amountToRemit,
        betCount: projection.betCount
    };
};
