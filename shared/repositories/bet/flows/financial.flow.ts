import { IBetStorage } from '../bet.ports';
import { BetDomainModel, RawBetTotals } from '../bet.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FinancialFlow');

const getTodayEnd = (todayStart: number): number =>
    todayStart + (24 * 60 * 60 * 1000);

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
        log.debug('Financial flow input', {
            todayStart,
            structureId: structureId ?? 'all'
        });

        // CENTRALIZACIÓN SSOT: El storage ahora se encarga de filtrar
        const filteredBets = await storage.getFiltered({ todayStart, structureId });

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
            betCount: totals.betCount,
            totalBetsFiltered: filteredBets.length
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
        log.debug('Totals by draw input', {
            todayStart,
            structureId: structureId ?? 'all'
        });

        // CENTRALIZACIÓN SSOT: El storage ahora se encarga de filtrar
        const filteredBets = await storage.getFiltered({ todayStart, structureId });

        const totalsByDraw = filteredBets.reduce<Record<string, RawBetTotals>>((acc, bet) => {
            const drawId = String(bet.drawId || 'unknown');
            const amount = Number(bet.amount) || 0;
            const currentDrawTotals = acc[drawId] || createEmptyTotals();

            return {
                ...acc,
                [drawId]: {
                    totalCollected: currentDrawTotals.totalCollected + amount,
                    betCount: currentDrawTotals.betCount + 1
                }
            };
        }, {});

        log.debug('Totals by draw final', {
            drawsCount: Object.keys(totalsByDraw).length,
            totalBetsFiltered: filteredBets.length
        });
        return totalsByDraw;
    } catch (error) {
        log.error('Error aggregating totals by draw ID', error);
        return {};
    }
};
