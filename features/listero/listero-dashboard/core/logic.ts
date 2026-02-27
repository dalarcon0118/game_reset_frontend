import { FinancialSummary, DrawType, DRAW_STATUS } from '@/types';
import { PendingBet } from '@/shared/services/offline_storage';
import { DailyTotals, isExpired, isClosingSoon, StatusFilter, DRAW_FILTER } from './core.types';
import { Model } from './model';
import { RemoteData, WebData } from '@/shared/core/remote.data';
import { logger } from '@/shared/utils/logger';
import { DashboardUser } from './user.dto';

const log = logger.withTag('DASHBOARD_LOGIC');

/**
 * Helper to calculate the total amount of a bet payload (single or bulk)
 */
export const calculatePayloadAmount = (payload: any): number => {
    let total = 0;

    // 1. Single bet legacy field or explicit amount
    if (payload.amount) {
        total += Number(payload.amount) || 0;
    }

    // 2. Bulk fields
    if (payload.fijosCorridos && Array.isArray(payload.fijosCorridos)) {
        total += payload.fijosCorridos.reduce((acc: number, bet: any) =>
            acc + (Number(bet.fijoAmount) || 0) + (Number(bet.corridoAmount) || 0), 0);
    }

    if (payload.parlets && Array.isArray(payload.parlets)) {
        total += payload.parlets.reduce((acc: number, bet: any) => {
            if (bet.bets && Array.isArray(bet.bets) && bet.bets.length >= 2 && bet.amount) {
                const n = bet.bets.length;
                // Combinatorial formula: n * (n - 1) / 2
                const numCombinations = (n * (n - 1)) / 2;
                const parletTotal = numCombinations * (Number(bet.amount) || 0);
                return acc + parletTotal;
            }
            return acc;
        }, 0);
    }

    if (payload.centenas && Array.isArray(payload.centenas)) {
        total += payload.centenas.reduce((acc: number, bet: any) => acc + (Number(bet.amount) || 0), 0);
    }

    if (payload.loteria && Array.isArray(payload.loteria)) {
        total += payload.loteria.reduce((acc: number, bet: any) => acc + (Number(bet.amount) || 0), 0);
    }

    return total;
};

export const calculatePendingDelta = (pendingBets: PendingBet[], commissionRate: number): DailyTotals => {
    const now = new Date();
    // Reset to start of day (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // End of day (23:59:59.999)
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    return pendingBets.reduce((acc, bet) => {
        // Strict date filtering: 00:00 to 23:59
        if (bet.timestamp >= startOfDay && bet.timestamp < endOfDay) {
            const amount = calculatePayloadAmount(bet);
            const commission = amount * commissionRate;

            return {
                totalCollected: acc.totalCollected + amount,
                premiumsPaid: acc.premiumsPaid,
                netResult: acc.netResult + amount,
                estimatedCommission: acc.estimatedCommission + commission,
                amountToRemit: acc.amountToRemit + (amount - commission),
            };
        }
        return acc;
    }, {
        totalCollected: 0,
        premiumsPaid: 0,
        netResult: 0,
        estimatedCommission: 0,
        amountToRemit: 0
    });
};

export const summaryToTotals = (summary: FinancialSummary, commissionRate: number): DailyTotals => {
    const collected = summary.totalCollected || 0;
    const premiums = summary.premiumsPaid || 0;
    const net = summary.netResult || (collected - premiums);
    const commission = collected * commissionRate;

    return {
        totalCollected: collected,
        premiumsPaid: premiums,
        netResult: net,
        estimatedCommission: commission,
        amountToRemit: net - commission,
    };
};

/**
 * Enriches draws with financial information from a summary and adds pending bets.
 */
export const enrichDraws = (
    draws: DrawType[],
    summary: FinancialSummary | null,
    pendingBets: PendingBet[] = [],
    syncedBets: PendingBet[] = [] // New parameter to include already synced bets in reconciliation
): DrawType[] => {
    // 1. Create a map for financial data from summary
    const financialMap = new Map(
        summary?.draws?.map(d => [d.id_sorteo.toString(), d]) || []
    );

    // 2. Create a map for local totals by drawId (Pending + Synced)
    const localMap = new Map<string, number>();
    const pendingCountMap = new Map<string, number>();
    const processedBetIds = new Set<string>(); // To avoid double counting synced bets if they appear in summary

    // Process pending bets (always include these)
    pendingBets.forEach(bet => {
        const drawId = (bet.draw || bet.drawId || '').toString();
        if (drawId) {
            const amount = calculatePayloadAmount(bet);
            const current = localMap.get(drawId) || 0;
            localMap.set(drawId, current + amount);
            pendingCountMap.set(drawId, (pendingCountMap.get(drawId) || 0) + 1);
        }
    });

    // Process synced bets (the local "truth" for recently synced items)
    syncedBets.forEach(bet => {
        const drawId = (bet.draw || bet.drawId || '').toString();
        const betId = bet.offlineId;
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
                syncedCount: syncedBets.filter(b => (b.draw || b.drawId || '').toString() === drawId).length,
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
    return draws.reduce(
        (acc, draw) => {
            const collected = draw.totalCollected || 0;
            const premiums = draw.premiumsPaid || 0;
            const net = draw.netResult || (collected - premiums);
            const commission = collected * commissionRate;

            return {
                totalCollected: acc.totalCollected + collected,
                premiumsPaid: acc.premiumsPaid + premiums,
                netResult: acc.netResult + net,
                estimatedCommission: acc.estimatedCommission + commission,
                amountToRemit: acc.amountToRemit + (net - commission),
            };
        },
        {
            totalCollected: 0,
            premiumsPaid: 0,
            netResult: 0,
            estimatedCommission: 0,
            amountToRemit: 0
        }
    );
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
    pendingBets: PendingBet[] = [],
    syncedBets: PendingBet[] = []
): { filteredDraws: DrawType[], dailyTotals: DailyTotals } => {

    const safeDrawsData = Array.isArray(drawsData) ? drawsData : null;

    // Default empty result
    const result = {
        filteredDraws: [] as DrawType[],
        dailyTotals: {
            totalCollected: 0,
            premiumsPaid: 0,
            netResult: 0,
            estimatedCommission: 0,
            amountToRemit: 0
        }
    };

    if (!safeDrawsData) {
        // If we have summary but no draws (rare but possible), we can still calculate totals from summary
        if (summaryData) {
            result.dailyTotals = summaryToTotals(summaryData, commissionRate);
        }
    } else {
        // 1. Enrich draws with summary data AND pending bets AND synced bets if available
        const enrichedDraws = enrichDraws(safeDrawsData, summaryData, pendingBets, syncedBets);

        // 2. Filter draws
        const filtered = filterDraws(enrichedDraws, filter);
        result.filteredDraws = filtered as DrawType[];

        // 3. Calculate totals
        // Prioritize summary data for daily totals if available
        if (summaryData) {
            result.dailyTotals = summaryToTotals(summaryData, commissionRate);
        } else {
            // FIX: Always calculate totals from ALL draws (enrichedDraws), not just the filtered ones.
            // This ensures the "Global Summary" remains stable and represents the daily total
            // even when the user filters the list view (e.g., viewing only "Open" draws).
            result.dailyTotals = calculateTotals(enrichedDraws, commissionRate);
        }
    }

    // 4. Add Pending Bets (Offline Delta)
    if (pendingBets.length > 0) {
        const pendingDelta = calculatePendingDelta(pendingBets, commissionRate);
        result.dailyTotals = {
            totalCollected: result.dailyTotals.totalCollected + pendingDelta.totalCollected,
            premiumsPaid: result.dailyTotals.premiumsPaid + pendingDelta.premiumsPaid,
            netResult: result.dailyTotals.netResult + pendingDelta.netResult,
            estimatedCommission: result.dailyTotals.estimatedCommission + pendingDelta.estimatedCommission,
            amountToRemit: result.dailyTotals.amountToRemit + pendingDelta.amountToRemit
        };
    }

    return result;
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
        return model;
    }

    // 2. Handle User Update
    // With Strict DTO, we KNOW structureId and commissionRate exist if the user exists.
    // No more optional chaining guessing games.
    const newStructureId = user.structureId;
    const newCommissionRate = user.commissionRate;

    // Check if critical structure changed
    const structureChanged = model.userStructureId !== newStructureId;

    // Check if commission changed
    const commissionChanged = model.commissionRate !== newCommissionRate;

    if (!structureChanged && !commissionChanged) {
        // No material change, return model as is (preserves referential equality)
        log.debug('User synced but no material change', { id: user.id });
        return model;
    }

    log.info('User structure/commission updated', {
        oldStruct: model.userStructureId,
        newStruct: newStructureId,
        oldComm: model.commissionRate,
        newComm: newCommissionRate,
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
