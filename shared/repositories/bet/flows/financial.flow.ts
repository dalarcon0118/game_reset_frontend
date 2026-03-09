import { IBetStorage } from '../bet.ports';
import { BetDomainModel, RawBetTotals } from '../bet.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FinancialFlow');

interface FinancialFlowContext {
    allBets: BetDomainModel[];
    filteredBets: BetDomainModel[];
}

const getTodayEnd = (todayStart: number): number =>
    todayStart + (24 * 60 * 60 * 1000);

const filterBetsByContext = (
    bets: BetDomainModel[],
    todayStart: number,
    structureId?: string
): FinancialFlowContext => {
    const todayEnd = getTodayEnd(todayStart);
    const filteredBets = bets.filter((bet) => {
        const timestamp = Number(bet.timestamp) || 0;
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

const createEmptyTotals = (): RawBetTotals => ({
    totalCollected: 0,
    betCount: 0
});

/**
 * Calculates raw financial aggregation based on stored bets.
 */
export const getFinancialSummaryFlow = async (
    storage: IBetStorage,
    todayStart: number,
    structureId?: string
): Promise<RawBetTotals> => {
    try {
        const allBets = await storage.getAll();
        log.debug('Financial flow input', {
            todayStart,
            structureId: structureId ?? 'all',
            totalBetsRead: allBets.length
        });

        const { filteredBets } = filterBetsByContext(allBets, todayStart, structureId);
        const totals = filteredBets.reduce<RawBetTotals>((acc, bet) => {
            const amount = Number(bet.amount) || 0;
            return {
                ...acc,
                totalCollected: acc.totalCollected + amount,
                betCount: acc.betCount + 1
            };
        }, createEmptyTotals());

        log.debug('Financial flow final', {
            totalCollected: totals.totalCollected,
            betCount: totals.betCount
        });
        return totals;
    } catch (error) {
        log.error('Error aggregating raw financial data', error);
        return createEmptyTotals();
    }
};

/**
 * Calculates raw financial totals grouped by Draw ID.
 */
export const getTotalsByDrawIdFlow = async (
    storage: IBetStorage,
    todayStart: number,
    structureId?: string
): Promise<Record<string, RawBetTotals>> => {
    try {
        const allBets = await storage.getAll();
        log.debug('Totals by draw input', {
            todayStart,
            structureId: structureId ?? 'all',
            totalBetsRead: allBets.length
        });

        const { filteredBets } = filterBetsByContext(allBets, todayStart, structureId);
        const groupedTotals: Record<string, RawBetTotals> = {};
        let discardedWithoutDraw = 0;
        filteredBets.forEach((bet) => {
            const drawId = bet.drawId ? String(bet.drawId) : null;
            if (!drawId) {
                discardedWithoutDraw += 1;
                return;
            }
            if (!groupedTotals[drawId]) {
                groupedTotals[drawId] = createEmptyTotals();
            }

            const amount = Number(bet.amount) || 0;
            groupedTotals[drawId].totalCollected += amount;
            groupedTotals[drawId].betCount += 1;
        });

        log.debug('Totals by draw final', {
            drawCount: Object.keys(groupedTotals).length,
            filteredCount: filteredBets.length,
            discardedWithoutDraw
        });
        return groupedTotals;
    } catch (error) {
        log.error('Error aggregating raw totals by draw', error);
        return {};
    }
};
