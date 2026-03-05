import { IBetStorage } from '../bet.ports';
import { BetDomainModel } from '../bet.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FinancialFlow');

export interface FinancialSummary {
    totalCollected: number;
    totalPaid: number;
    premiumsPaid: number;
    netResult: number;
    betCount: number;
}

interface FinancialFlowContext {
    allBets: BetDomainModel[];
    filteredBets: BetDomainModel[];
}

const getTodayEnd = (todayStart: number): number =>
    todayStart + (24 * 60 * 60 * 1000);

const resolveDrawId = (bet: BetDomainModel): string | null => {
    const primaryDrawId = bet.drawId;
    const fallbackDrawId = (bet as any).data?.draw;
    const candidate = primaryDrawId === undefined || primaryDrawId === null || String(primaryDrawId).trim() === ''
        ? fallbackDrawId
        : primaryDrawId;
    if (candidate === undefined || candidate === null || String(candidate).trim() === '') {
        return null;
    }
    return String(candidate);
};

const resolveAmount = (bet: BetDomainModel): number => {
    const rawAmount = bet.amount ?? (bet as any).data?.amount;
    const amount = Number(rawAmount);
    return Number.isFinite(amount) ? amount : 0;
};

const resolveTimestamp = (bet: BetDomainModel): number => {
    const timestamp = Number(bet.timestamp ?? (bet as any).data?.timestamp);
    return Number.isFinite(timestamp) ? timestamp : 0;
};

const filterBetsByContext = (
    bets: BetDomainModel[],
    todayStart: number,
    structureId?: string
): FinancialFlowContext => {
    const todayEnd = getTodayEnd(todayStart);
    const filteredBets = bets.filter((bet) => {
        const timestamp = resolveTimestamp(bet);
        const isToday = timestamp >= todayStart && timestamp < todayEnd;
        const matchesStructure = !structureId || String(bet.ownerStructure) === String(structureId);
        return isToday && matchesStructure;
    });

    log.debug('Financial flow intermediate', {
        totalBetsRead: bets.length,
        totalBetsFiltered: filteredBets.length,
        todayStart,
        todayEnd,
        structureId: structureId ?? 'all'
    });

    return {
        allBets: bets,
        filteredBets
    };
};

const createEmptySummary = (): FinancialSummary => ({
    totalCollected: 0,
    totalPaid: 0,
    premiumsPaid: 0,
    netResult: 0,
    betCount: 0
});

/**
 * Calculates financial summary based on stored bets.
 */
export const getFinancialSummaryFlow = async (
    storage: IBetStorage,
    todayStart: number,
    structureId?: string
): Promise<FinancialSummary> => {
    try {
        const allBets = await storage.getAll();
        log.debug('Financial flow input', {
            todayStart,
            structureId: structureId ?? 'all',
            totalBetsRead: allBets.length
        });

        const { filteredBets } = filterBetsByContext(allBets, todayStart, structureId);
        const summary = filteredBets.reduce<FinancialSummary>((acc, bet) => {
            const amount = resolveAmount(bet);
            return {
                ...acc,
                totalCollected: acc.totalCollected + amount,
                betCount: acc.betCount + 1
            };
        }, createEmptySummary());
        summary.netResult = summary.totalCollected - summary.totalPaid;

        log.debug('Financial flow final', {
            totalCollected: summary.totalCollected,
            betCount: summary.betCount,
            netResult: summary.netResult
        });
        return summary;
    } catch (error) {
        log.error('Error calculating financial summary', error);
        return createEmptySummary();
    }
};

/**
 * Calculates financial totals grouped by Draw ID.
 */
export const getTotalsByDrawIdFlow = async (
    storage: IBetStorage,
    todayStart: number,
    structureId?: string
): Promise<Record<string, FinancialSummary>> => {
    try {
        const allBets = await storage.getAll();
        log.debug('Totals by draw input', {
            todayStart,
            structureId: structureId ?? 'all',
            totalBetsRead: allBets.length
        });

        const { filteredBets } = filterBetsByContext(allBets, todayStart, structureId);
        const totals: Record<string, FinancialSummary> = {};
        let discardedWithoutDraw = 0;
        filteredBets.forEach((bet) => {
            const drawId = resolveDrawId(bet);
            if (!drawId) {
                discardedWithoutDraw += 1;
                return;
            }
            if (!totals[drawId]) {
                totals[drawId] = createEmptySummary();
            }

            const amount = resolveAmount(bet);
            totals[drawId].totalCollected += amount;
            totals[drawId].betCount += 1;
            totals[drawId].netResult = totals[drawId].totalCollected - totals[drawId].totalPaid;
        });

        log.debug('Totals by draw final', {
            drawCount: Object.keys(totals).length,
            filteredCount: filteredBets.length,
            discardedWithoutDraw
        });
        return totals;
    } catch (error) {
        log.error('Error calculating totals by draw', error);
        return {};
    }
};
