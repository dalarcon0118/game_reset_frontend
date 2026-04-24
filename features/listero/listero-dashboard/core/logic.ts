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
 * Filter draws by status using DrawRepository (SSOT filter logic).
 * Only filtering, no financial enrichment - that's done by DrawRepository.
 */
export const filterDraws = (
    draws: DrawType[],
    filter: StatusFilter,
    currentTime: number
): DrawType[] => {
    return draws.filter(draw => {
        switch (filter) {
            case 'all':
                return true;
            default:
                return true;
        }
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
 * SSOT: Financial data comes from DrawRepository; only filtering is done here.
 */
export const recalculateDashboardState = (
    drawsData: DrawType[] | null,
    summaryData: any | null,
    filter: StatusFilter,
    commissionRate: number,
    now: number
): { filteredDraws: DrawType[], dailyTotals: DailyTotals } => {

    log.info('[CRITERION_4_START] RECALCULATE_STATE: Iniciando recalculo de estado', {
        inputDrawsCount: drawsData?.length ?? 0,
        filter,
        commissionRate,
        now
    });

    const safeDrawsData = Array.isArray(drawsData) ? drawsData : [];

    // Draws already enriched by DrawRepository.enrichDrawsWithFinancialData()
    // Only filter using SSOT from drawRepository
    log.debug('[CRITERION_4_STEP_1] FILTERING_DRAWS: Filtrando sorteos por criterio', { filter });
    const filteredDraws = drawRepository.filterDraws(safeDrawsData, filter, now);

    // Fail-fast: Validate SSOT returned valid result (StrictExecutionDSL compliance)
    if (!Array.isArray(filteredDraws)) {
        log.error('[SSOT_FAILURE] drawRepository.filterDraws returned invalid result', {
            inputDrawsCount: safeDrawsData.length,
            filter,
            resultType: typeof filteredDraws,
            now: new Date(now).toISOString()
        });
        throw new Error('SSOT_FILTER_FAILURE: drawRepository.filterDraws must return an array');
    }

    if (filteredDraws.length === 0 && safeDrawsData.length > 0) {
        log.debug('[SSOT_EMPTY_RESULT] drawRepository.filterDraws returned empty array', {
            inputDrawsCount: safeDrawsData.length,
            filter
        });
    }

    log.info('[CRITERION_4B] DRAWS_FILTERED: Sorteos filtrados', {
        filteredCount: filteredDraws.length,
        filter
    });

    // 3. Calculate daily totals from all draws (already enriched by DrawRepository)
    log.debug('[CRITERION_4_STEP_3] CALCULATING_TOTALS: Calculando totales');
    const dailyTotals = calculateTotals(safeDrawsData, commissionRate);

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
