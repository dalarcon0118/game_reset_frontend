import { DrawType, BetType } from '@/types';
import { DailyTotals, StatusFilter } from './core.types';
import { Model } from './model';
import { RemoteData, WebData } from '@core/tea-utils';
import { logger } from '@/shared/utils/logger';
import { DashboardUser } from './user.dto';
import { drawRepository } from '@/shared/repositories/draw';
import { calculateFinancials } from '@/shared/utils/financial.logic';

const log = logger.withTag('DASHBOARD_LOGIC');

const calculatePayloadAmount = (bet: BetType): number => {
    return Number(bet.amount) || 0;
};

/**
 * Enriches draws with local bets data.
 * Financial state is derived exclusively from the sum of bets.
 */
export const enrichDraws = (
    draws: DrawType[],
    commissionRate: number,
    pendingBets: BetType[] = [],
    syncedBets: BetType[] = []
): DrawType[] => {
    // 1. Create a map for local totals by drawId (Pending + Synced)
    const localMap = new Map<string, number>();
    const pendingCountMap = new Map<string, number>();

    // Process pending bets
    pendingBets.forEach(bet => {
        const drawId = (bet.drawId || '').toString();
        if (drawId) {
            const amount = calculatePayloadAmount(bet);
            const current = localMap.get(drawId) || 0;
            localMap.set(drawId, current + amount);
            pendingCountMap.set(drawId, (pendingCountMap.get(drawId) || 0) + 1);
        }
    });

    // Process synced bets
    syncedBets.forEach(bet => {
        const drawId = (bet.drawId || '').toString();
        if (drawId) {
            const amount = calculatePayloadAmount(bet);
            const current = localMap.get(drawId) || 0;
            localMap.set(drawId, current + amount);
        }
    });

    return draws.map(draw => {
        const drawId = draw.id.toString();
        const collected = localMap.get(drawId) || 0;
        const pendingCount = pendingCountMap.get(drawId) || 0;

        // CRITICAL: Preserve backend values - do NOT overwrite premiumsPaid and netResult
        // The backend (FinancialSummaryReadModel) is the SSOT for prizes after draw is completed.
        // Only totalCollected comes from local bets (pending + synced).
        // premiumsPaid and netResult come pre-calculated from backend via mapBackendDrawToFrontend.
        const paid = draw.premiumsPaid ?? 0;
        const net = draw.netResult ?? 0;

        return {
            ...draw,
            totalCollected: collected,
            premiumsPaid: paid,
            netResult: net,
            _offline: {
                pendingCount,
                localAmount: collected,
                backendAmount: 0,
                hasDiscrepancy: false
            }
        } as DrawType;
    });
};

export const calculateTotals = (draws: DrawType[], commissionRate: number): DailyTotals => {
    const rawData = draws.reduce((acc, draw) => ({
        totalCollected: acc.totalCollected + (Number(draw.totalCollected) || 0),
        premiumsPaid: acc.premiumsPaid + (Number(draw.premiumsPaid) || 0),
        betCount: acc.betCount + 1
    }), { totalCollected: 0, premiumsPaid: 0, betCount: 0 });

    const { totals } = calculateFinancials(rawData, commissionRate);
    return totals;
};

/**
 * Recalculates derived state (filteredDraws, dailyTotals) based on current model data.
 * Financial state is derived exclusively from the sum of bets.
 */
export const recalculateDashboardState = (
    drawsData: DrawType[] | null,
    summaryData: any | null,
    filter: StatusFilter,
    commissionRate: number,
    now: number,
    pendingBets: BetType[] = [],
    syncedBets: BetType[] = []
): { filteredDraws: DrawType[], dailyTotals: DailyTotals } => {

    log.info('[CRITERION_4_START] RECALCULATE_STATE: Iniciando recalculo de estado', {
        inputDrawsCount: drawsData?.length ?? 0,
        filter,
        commissionRate,
        pendingBetsCount: pendingBets.length,
        syncedBetsCount: syncedBets.length,
        now
    });

    const safeDrawsData = Array.isArray(drawsData) ? drawsData : null;

    // 1. Enrich draws with bet sums
    log.debug('[CRITERION_4_STEP_1] ENRICHING_DRAWS: Enriquecendo sorteos con datos locales');
    const enrichedDraws = safeDrawsData
        ? enrichDraws(safeDrawsData, commissionRate, pendingBets, syncedBets)
        : [];

    log.info('[CRITERION_4A] DRAWS_ENRICHED: Sorteos enriquecidos', {
        enrichedDrawsCount: enrichedDraws.length,
        premiumsInDraws: enrichedDraws.map(d => ({ id: d.id, premiumsPaid: d.premiumsPaid, totalCollected: d.totalCollected }))
    });

    // 2. Filter enriched draws using SSOT from drawRepository
    log.debug('[CRITERION_4_STEP_2] FILTERING_DRAWS: Filtrando sorteos por criterio', { filter });
    const filteredDraws = drawRepository.filterDraws(enrichedDraws, filter, now);

    // Fail-fast: Validate SSOT returned valid result (StrictExecutionDSL compliance)
    if (!Array.isArray(filteredDraws)) {
        log.error('[SSOT_FAILURE] drawRepository.filterDraws returned invalid result', {
            inputDrawsCount: enrichedDraws.length,
            filter,
            resultType: typeof filteredDraws,
            now: new Date(now).toISOString()
        });
        throw new Error('SSOT_FILTER_FAILURE: drawRepository.filterDraws must return an array');
    }

    if (filteredDraws.length === 0 && enrichedDraws.length > 0) {
        log.debug('[SSOT_EMPTY_RESULT] drawRepository.filterDraws returned empty array', {
            inputDrawsCount: enrichedDraws.length,
            filter
        });
    }

    log.info('[CRITERION_4B] DRAWS_FILTERED: Sorteos filtrados', {
        filteredCount: filteredDraws.length,
        filter
    });

    // 3. Calculate daily totals from all enriched draws
    log.debug('[CRITERION_4_STEP_3] CALCULATING_TOTALS: Calculando totales');
    const dailyTotals = calculateTotals(enrichedDraws, commissionRate);

    log.info('[CRITERION_4C] DAILY_TOTALS_SUMMARY: Totales diarios calculados', {
        totalCollected: dailyTotals.totalCollected,
        premiumsPaid: dailyTotals.premiumsPaid,
        netResult: dailyTotals.netResult,
        estimatedCommission: dailyTotals.estimatedCommission,
        amountToRemit: dailyTotals.amountToRemit
    });

    return {
        filteredDraws,
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
                draws: RemoteData.notAsked() // Clear draws
            };
        }
        // Already cleared, return same model reference to avoid re-renders
        return model;
    }

    // 2. Handle User Update
    // With Strict DTO, we KNOW structureId and commissionRate exist if the user exists.
    const newStructureId = user.structureId;
    const newCommissionRate = user.commissionRate;

    log.info('[DIAGNOSTIC] logic.handleAuthUserSynced details', {
        user_id: user.id,
        user_name: user.username,
        newStructureId,
        newCommissionRate,
        oldStructureId: model.userStructureId,
        oldCommissionRate: model.commissionRate
    });

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
        draws: structureChanged ? RemoteData.notAsked() : model.draws
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
