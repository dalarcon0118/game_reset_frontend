import { FinancialSummary, DrawType, DRAW_STATUS, BetType } from '@/types';
import { DailyTotals, isExpired, isClosingSoon, StatusFilter, DRAW_FILTER } from './core.types';
import { Model } from './model';
import { RemoteData, WebData } from '@/shared/core/tea-utils';
import { logger } from '@/shared/utils/logger';
import { DashboardUser } from './user.dto';
// Importación de la utilidad centralizada
import { calculateFinancials } from '@/shared/utils/financial.logic';

const log = logger.withTag('DASHBOARD_LOGIC');

/**
 * Helper to calculate the total amount of a bet (single or bulk)
 */
export const calculatePayloadAmount = (bet: BetType): number => {
    return Number(bet.amount) || 0;
};

/**
 * Calculates financial delta for a set of bets.
 */
export const calculatePendingDelta = (pendingBets: BetType[], commissionRate: number): DailyTotals => {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const rawData = pendingBets.reduce((acc, bet) => {
        if (bet.timestamp && bet.timestamp >= startOfDay && bet.timestamp < endOfDay) {
            const amount = calculatePayloadAmount(bet);
            return {
                ...acc,
                totalCollected: acc.totalCollected + amount,
                betCount: acc.betCount + 1
            };
        }
        return acc;
    }, { totalCollected: 0, premiumsPaid: 0, betCount: 0 });

    const { totals } = calculateFinancials(rawData, commissionRate);
    return totals;
};

export const summaryToTotals = (summary: FinancialSummary, commissionRate: number): DailyTotals => {
    const rawData = {
        totalCollected: summary.totalCollected || 0,
        premiumsPaid: summary.premiumsPaid || 0,
        betCount: (summary as any).betCount || 0
    };

    const { totals } = calculateFinancials(rawData, commissionRate);
    return totals;
};

/**
 * Enriches draws with local pending bets data.
 */
export const enrichDraws = (
    draws: DrawType[],
    summary: FinancialSummary | null,
    pendingBets: BetType[] = [],
    syncedBets: BetType[] = [] // New parameter to include already synced bets in reconciliation
): DrawType[] => {
    // DEBUG: Log summary data structure and pending bets
    log.info('EnrichDraws called', {
        drawsCount: draws.length,
        hasSummary: !!summary,
        summaryKeys: summary ? Object.keys(summary) : [],
        sorteosCount: summary?.sorteos?.length || 0,
        pendingBetsCount: pendingBets.length,
        syncedBetsCount: syncedBets.length
    });

    // DEBUG: Log sample of pending bets to understand structure
    if (pendingBets.length > 0) {
        log.debug('PENDING_BETS_SAMPLE', {
            firstBet: pendingBets[0],
            firstBetKeys: Object.keys(pendingBets[0] || {}),
            betDrawIds: pendingBets.map(b => b.draw)
        });
    }

    // 1. Create a map for financial data from summary
    // DEBUG: Log what fields are available in summary.draws
    if (summary?.draws && summary.draws.length > 0) {
        log.info('Summary draws sample', {
            firstDraw: summary.draws[0],
            keys: Object.keys(summary.draws[0] || {})
        });
    }

    // DEBUG: Log all summary.draws to find the 300 value
    if (summary?.draws) {
        summary.draws.forEach((draw: any) => {
            log.info('Summary draw detail', {
                id_sorteo: draw.id_sorteo,
                source: draw.source,
                colectado: draw.colectado,
                pagado: draw.pagado
            });
        });
    }

    const financialMap = new Map(
        summary?.draws?.map(d => [d.id_sorteo?.toString(), d]) || []
    );

    // 2. Create a map for local totals by drawId (Pending + Synced)
    const localMap = new Map<string, number>();
    const pendingCountMap = new Map<string, number>();
    const processedBetIds = new Set<string>(); // To avoid double counting synced bets if they appear in summary

    // Process pending bets (always include these)
    pendingBets.forEach(bet => {
        const drawId = (bet.draw || '').toString();
        if (drawId) {
            const amount = calculatePayloadAmount(bet);
            const current = localMap.get(drawId) || 0;
            localMap.set(drawId, current + amount);
            pendingCountMap.set(drawId, (pendingCountMap.get(drawId) || 0) + 1);
        }
    });

    // Process synced bets (the local "truth" for recently synced items)
    syncedBets.forEach(bet => {
        const drawId = (bet.draw || '').toString();
        const betId = bet.id;
        if (drawId && betId) {
            const amount = calculatePayloadAmount(bet);
            const current = localMap.get(drawId) || 0;
            localMap.set(drawId, current + amount);
            processedBetIds.add(betId.toString());
        }
    });

    return draws.map(draw => {
        const drawId = draw.id.toString();
        const financial = financialMap.get(drawId);

        // DEBUG: Log para ver qué datos viene del summary
        if (!financial) {
            log.info(`No financial data for draw ${drawId} (${draw.source})`, {
                drawId,
                source: draw.source,
                availableDrawIds: Array.from(financialMap.keys()).slice(0, 10)
            });
        }

        // IMPORTANT: If we have synced bets that are already in the backend summary,
        // we might be double counting if we just add localMap to backendCollected.
        // However, the current logic uses Math.max(backendCollected, localAmount).
        // This is safer but might still hide missing bets if backend > local.

        const localAmount = localMap.get(drawId) || 0;
        const pendingCount = pendingCountMap.get(drawId) || 0;

        // Base values from summary or 0
        const backendCollected = financial?.colectado || 0;
        const paid = financial?.pagado || 0;

        // RECONCILIATION LOGIC: 
        // We prioritize localAmount if it's higher than backendCollected (e.g. backend hasn't updated yet)
        // or if they are different and we trust local more.
        const collected = Math.max(backendCollected, localAmount);
        const net = collected - paid;

        const hasDiscrepancy = Math.abs(backendCollected - localAmount) > 0.01;

        if (hasDiscrepancy) {
            log.info(`Financial discrepancy detected for draw ${drawId} (${draw.source})`, {
                backendCollected,
                localAmount,
                diff: localAmount - backendCollected,
                pendingCount,
                syncedCount: syncedBets.filter(b => (b.draw || '').toString() === drawId).length,
                // Log if we suspect some bets are missing from local storage but present in backend
                backendHigher: backendCollected > localAmount
            });
        }

        return {
            ...draw,
            totalCollected: collected,
            premiumsPaid: paid,
            netResult: net,
            _offline: {
                pendingCount,
                localAmount: localAmount,
                backendAmount: backendCollected,
                hasDiscrepancy
            }
        } as DrawType;
    });
};

export const calculateTotals = (draws: DrawType[], commissionRate: number): DailyTotals => {
    const rawData = draws.reduce((acc, draw) => ({
        totalCollected: acc.totalCollected + (Number(draw.totalCollected) || 0),
        premiumsPaid: acc.premiumsPaid + (Number(draw.premiumsPaid) || 0),
        betCount: acc.betCount + 1 // Estimación basada en sorteos
    }), { totalCollected: 0, premiumsPaid: 0, betCount: 0 });

    const { totals } = calculateFinancials(rawData, commissionRate);
    return totals;
};

export const filterDraws = (draws: DrawType[], filter: StatusFilter): DrawType[] => {

    const filtered = draws.filter((draw: DrawType) => {
        const expired = isExpired(draw);
        let passes = false;

        if (filter === DRAW_FILTER.ALL) passes = true;

        else if (filter === DRAW_FILTER.SCHEDULED) {
            passes = (draw.status === DRAW_STATUS.SCHEDULED || draw.status === DRAW_STATUS.PENDING) && !expired;
        }

        else if (filter === DRAW_FILTER.OPEN) {
            passes = draw.status === DRAW_STATUS.OPEN && !expired;
        }

        else if (filter === DRAW_FILTER.CLOSED) {
            passes = (draw.status === DRAW_STATUS.CLOSED || expired) && !draw.winning_numbers;
        }

        else if (filter === DRAW_FILTER.CLOSING_SOON) {
            passes = (draw.status === DRAW_STATUS.OPEN || draw.is_betting_open === true) && isClosingSoon(draw.betting_end_time);
        }

        else if (filter === DRAW_FILTER.REWARDED) {
            // Explicitly cast status to string to allow comparison with 'rewarded'
            // even if strict types say it's not possible
            passes = (draw.status as string) === DRAW_STATUS.REWARDED || draw.is_rewarded === true || !!draw.winning_numbers;
        }

        return passes;
    });

    // Sort draws: Open first, then Pending, then by time
    return filtered.sort((a, b) => {
        const aOpen = a.status === DRAW_STATUS.OPEN || a.is_betting_open === true;
        const bOpen = b.status === DRAW_STATUS.OPEN || b.is_betting_open === true;

        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;

        const aPending = a.status === DRAW_STATUS.PENDING;
        const bPending = b.status === DRAW_STATUS.PENDING;

        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;

        // If same status, sort by end time
        const aTime = a.betting_end_time ? new Date(a.betting_end_time).getTime() : Infinity;
        const bTime = b.betting_end_time ? new Date(b.betting_end_time).getTime() : Infinity;

        return aTime - bTime;
    });
};

/**
 * Recalculates derived state (filteredDraws, dailyTotals) based on current model data.
 * Should be called whenever draws, summary, filter, or commission rate changes.
 */
export const recalculateDashboardState = (
    drawsData: DrawType[] | null,
    summaryData: FinancialSummary | null,
    filter: StatusFilter,
    commissionRate: number,
    pendingBets: BetType[] = [],
    syncedBets: BetType[] = []
): { filteredDraws: DrawType[], dailyTotals: DailyTotals } => {

    const safeDrawsData = Array.isArray(drawsData) ? drawsData : null;

    // 1. Enrich draws (if possible)
    const enrichedDraws = safeDrawsData
        ? enrichDraws(safeDrawsData, summaryData, pendingBets, syncedBets)
        : [];

    // 2. Base Totals from Summary or Draws
    let dailyTotals: DailyTotals;
    if (summaryData) {
        dailyTotals = summaryToTotals(summaryData, commissionRate);
    } else {
        dailyTotals = calculateTotals(enrichedDraws, commissionRate);
    }

    // 3. Add Pending Bets (Offline Delta) - Only if they were NOT already enriched into draws
    if (pendingBets.length > 0) {
        const pendingDelta = calculatePendingDelta(pendingBets, commissionRate);
        dailyTotals = {
            totalCollected: dailyTotals.totalCollected + pendingDelta.totalCollected,
            premiumsPaid: dailyTotals.premiumsPaid + pendingDelta.premiumsPaid,
            netResult: dailyTotals.netResult + pendingDelta.netResult,
            estimatedCommission: dailyTotals.estimatedCommission + pendingDelta.estimatedCommission,
            amountToRemit: dailyTotals.amountToRemit + pendingDelta.amountToRemit
        };
    }

    return {
        filteredDraws: filterDraws(enrichedDraws, filter) as DrawType[],
        dailyTotals
    };
};

// Return type for auth sync logic
export interface AuthSyncResult {
    nextModel: Model;
    shouldFetch: boolean;
    fetchId: string | null;
    shouldUpdateToken: boolean;
}

/**
 * Determines if we should fetch data for a given structure ID.
 * Prevents duplicate fetches if data is already loaded or loading.
 */
export const shouldFetchData = (model: Model, requestedId: string | null): boolean => {
    if (!requestedId || requestedId === '0') return false;

    // Already have data for this ID?
    if (model.draws.type === 'Success' && model.userStructureId === requestedId) {
        return false;
    }

    // Already loading for this ID?
    if (model.draws.type === 'Loading' && model.userStructureId === requestedId) {
        return false;
    }

    return true;
};

/**
 * Checks if an error corresponds to a rate limit (429) or throttling.
 */
export const checkRateLimit = (webData: WebData<any>): boolean => {
    if (webData.type !== 'Failure' || !webData.error) return false;
    const error = webData.error;
    return error.status === 429 || error.message?.includes('throttled');
};

export const handleAuthUserSynced = (model: Model, user: DashboardUser | null): Model => {
    // 1. Handle Logout / Null User
    if (!user) {
        // If we had a user before, we need to clear sensitive data
        if (model.currentUser) {
            log.info('User logged out, clearing dashboard state');
            return {
                ...model,
                currentUser: null,
                userStructureId: null,
                draws: RemoteData.notAsked(), // Clear draws
                summary: RemoteData.notAsked() // Clear summary
            };
        }
        // Already cleared, return same model reference to avoid re-renders
        return model;
    }

    // 2. Handle User Update
    // With Strict DTO, we KNOW structureId and commissionRate exist if the user exists.
    const newStructureId = user.structureId;
    const newCommissionRate = user.commissionRate;

    // Check if critical structure changed
    const structureChanged = model.userStructureId !== newStructureId;

    // Check if commission changed
    const commissionChanged = model.commissionRate !== newCommissionRate;

    if (!structureChanged && !commissionChanged) {
        // No material change, return model as is (preserves referential equality)
        return model;
    }

    log.info('User structure/commission updated', {
        oldStruct: model.userStructureId,
        newStruct: newStructureId,
        structureChanged
    });

    return {
        ...model,
        currentUser: user,
        userStructureId: newStructureId,
        commissionRate: newCommissionRate,
        // If structure changed, invalidate data to force refetch
        draws: structureChanged ? RemoteData.notAsked() : model.draws,
        summary: structureChanged ? RemoteData.notAsked() : model.summary
    };
};

/**
 * Handles logic for SSE Financial Updates.
 * Determines if the update is relevant for the current user structure.
 */
export const handleSseUpdate = (model: Model, update: any): { shouldFetch: boolean } => {
    if (update.type !== 'FINANCIAL_UPDATE' || !update.data) {
        return { shouldFetch: false };
    }

    const updateStructureId = update.structure_id ? String(update.structure_id) : null;

    if (updateStructureId && updateStructureId !== model.userStructureId) {
        return { shouldFetch: false };
    }

    return { shouldFetch: true };
};
