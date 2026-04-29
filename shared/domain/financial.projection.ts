/**
 * Financial Projection Calculator (CQRS Pattern)
 * Calculates financial projections from BetType (source of truth).
 * Fail-fast: Throws on invalid input to prevent silent errors.
 */

import { BetType } from '@/types';
import { FinancialProjection, DrawFinancial, BetTypeFinancial, DailyTotals } from './financial.types';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '../repositories/system/time';

const log = logger.withTag('<-----------FINANCIAL_PROJECTION----------->');

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
    const trustedNow = TimerRepository.getTrustedNow(Date.now());
    const today = new Date(trustedNow).toISOString().split('T')[0]; // UTC date for metadata



    log.debug('Calculating projection for today', today);
    const allBets = [...pendingBets, ...syncedBets];
    log.debug('All bets', JSON.stringify(allBets, null, 2));
    const validBets = allBets.filter(isValidBet);

    log.info('Calculating projection', {
        pendingBetsCount: pendingBets.length,
        syncedBetsCount: syncedBets.length,
        allBetsCount: allBets.length,
        validBetsCount: validBets.length,
        filteredOutCount: allBets.length - validBets.length,
        commissionRate,
        safeRate,
        structureId,
        today
    });

    if (validBets.length !== allBets.length) {
        const filtered = allBets.filter(b => !isValidBet);
        log.warn(`Filtered ${filtered.length} invalid bets`, filtered.map(b => ({
            id: b.id,
            status: b.status,
            timestamp: b.timestamp,
            timestampLocal: new Date(b.timestamp).toLocaleString()
        })));
    }

    let totalCollected = 0;
    let betCount = 0;
    const byDrawId: Record<string, DrawFinancial> = {};
    const byBetType: Record<string, BetTypeFinancial> = {};

    for (const bet of validBets) {
        const amount = Number(bet.amount) || 0;
        if (amount <= 0) {
            log.warn(`Skipping bet with invalid amount`, {
                betId: bet.id,
                amount,
                status: bet.status,
                timestamp: bet.timestamp
            });
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
            log.debug(`Created DrawFinancial for draw ${drawId}`);
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

    log.info(' calculated', {
        totalCollected,
        totalPremiums,
        estimatedCommission,
        netResult,
        betCount,
        drawsCount: Object.keys(byDrawId).length,
        betTypesCount: Object.keys(byBetType).length
    });

    for (const drawId of Object.keys(byDrawId)) {
        const draw = byDrawId[drawId];
        const drawCommission = draw.totalCollected * safeRate;
        draw.netResult = draw.totalCollected - draw.premiumsPaid - drawCommission;
    }

    const projection = {
        calculatedAt: trustedNow,
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

    log.info('Projection complete', {
        calculatedAt: trustedNow,
        date: today,
        totalCollected: projection.totalCollected,
        betCount: projection.betCount
    });

    return projection;
};

export const extractDailyTotals = (
    projection: FinancialProjection,
    commissionRate: number
): DailyTotals => {
    log.info('Extracting DailyTotals from projection', {
        totalCollected: projection.totalCollected,
        premiumsPaid: projection.premiumsPaid,
        estimatedCommission: projection.estimatedCommission,
        netResult: projection.netResult,
        betCount: projection.betCount
    });

    return {
        totalCollected: projection.totalCollected,
        premiumsPaid: projection.premiumsPaid,
        estimatedCommission: projection.estimatedCommission,
        netResult: projection.netResult,
        amountToRemit: projection.amountToRemit,
        betCount: projection.betCount
    };
};
