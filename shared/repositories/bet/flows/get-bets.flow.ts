import { Result, Task } from '@/shared/core';
import { BetType, GameType } from '@/types';
import { IBetStorage, IBetApi, ListBetsFilters } from '../bet.types';
import { drawRepository } from '../../draw';
import { mapBackendBetToFrontend, mapPendingBetsToFrontend } from '../bet.mapper.backend';
import { logger } from '@/shared/utils/logger';
import { toUtcISODate } from '@/shared/utils/formatters';

const log = logger.withTag('GetBetsFlow');

interface GetBetsContext {
    filters?: ListBetsFilters;
    betTypes: GameType[];
    offlineBets: BetType[];
    onlineBets: BetType[];
}

const normalizeKey = (value: unknown): string => String(value ?? '').trim();

const buildOnlineIdentitySets = (onlineRaw: any[]): {
    backendIds: Set<string>;
    externalIds: Set<string>;
} => {
    const backendIds = new Set<string>();
    const externalIds = new Set<string>();

    onlineRaw.forEach((bet: any) => {
        const backendId = normalizeKey(bet?.id);
        const externalId = normalizeKey(bet?.external_id);
        if (backendId) backendIds.add(backendId);
        if (externalId) externalIds.add(externalId);
    });

    return { backendIds, externalIds };
};

const shouldKeepOfflineBet = (
    bet: any,
    identities: { backendIds: Set<string>; externalIds: Set<string> }
): boolean => {
    if (!bet) return false;

    const status = normalizeKey(bet.status).toLowerCase();
    if (status !== 'synced') return true;

    const offlineExternalId = normalizeKey(bet.externalId);
    if (offlineExternalId && identities.externalIds.has(offlineExternalId)) {
        return false;
    }

    const linkedBackendIds = Array.isArray(bet.backendBets)
        ? bet.backendBets
            .map((mapped: any) => normalizeKey(mapped?.id))
            .filter(Boolean)
        : [];

    if (linkedBackendIds.some((id: string) => identities.backendIds.has(id))) {
        return false;
    }

    return true;
};

const normalizeNumbersKey = (numbers: BetType['numbers']): string => {
    if (numbers === null || numbers === undefined) return '';
    if (typeof numbers === 'string') return numbers.trim();
    if (typeof numbers === 'number' || typeof numbers === 'boolean') return String(numbers);
    try {
        return JSON.stringify(numbers);
    } catch {
        return String(numbers);
    }
};

const buildDedupKey = (bet: BetType): string => {
    const receiptCode = String(bet.receiptCode || '').trim();
    const externalId = String(bet.externalId || '').trim();
    if (receiptCode) return `rc:${receiptCode}`;
    if (externalId) return `ext:${externalId}`;
    return `id:${String(bet.id || '').trim()}`;
};

/**
 * Merges offline and online bets, deduplicating by semantic identity,
 * and applying a final safety filter for date in frontend.
 */
const mergeBets = (ctx: GetBetsContext): Result<Error, BetType[]> => {
    const betsMap = new Map<string, BetType>();

    ctx.offlineBets.forEach((bet: BetType) => {
        const key = buildDedupKey(bet);
        betsMap.set(key, bet);
    });

    ctx.onlineBets.forEach((bet: BetType) => {
        const key = buildDedupKey(bet);
        betsMap.set(key, bet);
    });

    let result = Array.from(betsMap.values());

    if (ctx.filters?.date) {
        const rawDate = ctx.filters.date;
        const filterDate = (typeof rawDate === 'number' || !isNaN(Number(rawDate)))
            ? toUtcISODate(Number(rawDate))
            : String(rawDate);

        log.info('Filtering bets by date', {
            originalFilter: rawDate,
            normalizedFilter: filterDate,
            totalBefore: result.length
        });

        result = result.filter(bet => {
            const betDate = toUtcISODate(bet.timestamp || Date.now());
            const isMatch = betDate === filterDate;

            if (!isMatch) {
                log.debug(`Bet excluded by date filter`, {
                    receiptCode: bet.receiptCode,
                    betDate,
                    expectedDate: filterDate
                });
            }

            return isMatch;
        });
    }

    log.info('GetBetsFlow result', {
        total: result.length,
        offline: ctx.offlineBets.length,
        online: ctx.onlineBets.length,
        filter: ctx.filters?.date || 'none'
    });

    return Result.ok(result);
};

/**
 * Helper to map raw backend types to GameType.
 */
const mapToGameType = (t: any): GameType => ({
    id: String(t.id),
    name: t.name,
    code: t.code || '',
    description: t.description || ''
});

/**
 * RESOLVE METADATA: Fetches bet types with a safety timeout.
 * Business logic: Metadata should never block transactional data.
 */
const resolveMetadata = (ctx: GetBetsContext, pTypes: Promise<Result<any, any>>): Task<Error, GetBetsContext> =>
    Task.fromPromise(async () => {
        const timeoutPromise = new Promise<Result<any, any>>((resolve) =>
            setTimeout(() => resolve(Result.error(new Error('METADATA_TIMEOUT'))), 2000)
        );

        const res = await Promise.race([pTypes, timeoutPromise]);

        const betTypes = res.isOk()
            ? (res.value as any[]).map(mapToGameType)
            : [];

        if (res.isErr() && res.error.message === 'METADATA_TIMEOUT') {
            log.warn('Metadata fetch timed out, proceeding with degraded mapping');
        }

        return { ...ctx, betTypes };
    });

/**
 * RESOLVE BETS: Fetches offline and online bets in parallel.
 * Business logic: Show local data immediately, merge with online data when ready.
 */
const resolveBets = (ctx: GetBetsContext, storage: IBetStorage, pOffline: Promise<any[]>, pOnline: Promise<any[]>): Task<Error, GetBetsContext> =>
    Task.fromPromise(async () => {
        const [offlineRaw, onlineRaw] = await Promise.all([
            pOffline,
            pOnline.catch(e => {
                const isTimeout = e?.message?.includes('timeout');
                const logLevel = isTimeout ? 'info' : 'warn';
                log[logLevel]('Online fetch failed, proceeding with offline data only', {
                    error: e?.message || String(e),
                    isTimeout
                });
                return [] as any[];
            })
        ]);

        const onlineIdentitySets = buildOnlineIdentitySets(onlineRaw as any[]);
        const reconciledOfflineRaw = (offlineRaw as any[]).filter((bet: any) =>
            shouldKeepOfflineBet(bet, onlineIdentitySets)
        );

        let offlineBets = mapPendingBetsToFrontend(reconciledOfflineRaw as any, ctx.filters, ctx.betTypes);

        // DEEP FALLBACK: If we have a receiptCode but no matches in recent draw cache, search everything
        if (ctx.filters?.receiptCode && offlineBets.length === 0) {
            log.info('ReceiptCode provided but no recent match found. Performing deep storage search.', { receiptCode: ctx.filters.receiptCode });
            const allLocal = await storage.getAll();
            const found = allLocal.filter(b => b.receiptCode === ctx.filters?.receiptCode);

            if (found.length > 0) {
                log.info('Found match in deep storage search', { count: found.length });
                offlineBets = mapPendingBetsToFrontend(found as any, ctx.filters, ctx.betTypes);
            }
        }

        const onlineBets = (onlineRaw as any[])
            .map(b => {
                try { return mapBackendBetToFrontend(b, ctx.betTypes); }
                catch (e) {
                    log.warn('Mapping error for bet', { betId: b.id, error: e });
                    return null;
                }
            })
            .filter(Boolean) as BetType[];

        return { ...ctx, offlineBets, onlineBets };
    });

/**
 * Flow for getting bets (Online + Offline merging).
 * Architecture: Resilient Pipeline (Parallel Fetch + Sequential Orchestration).
 */
export const getBetsFlow = (
    storage: IBetStorage,
    api: IBetApi,
    filters?: ListBetsFilters
): Task<Error, BetType[]> => {
    log.info('Starting GetBetsFlow (Resilient Pipeline)', { filters });

    // 1. PRE-FETCH (Parallel Request Layer)
    const storageFilters: any = {};
    if (filters?.drawId) storageFilters.drawId = filters.drawId;
    if (filters?.receiptCode) storageFilters.receiptCode = filters.receiptCode;
    if (filters?.date) {
        storageFilters.date = typeof filters.date === 'number' ? filters.date : new Date(filters.date).getTime();
    }

    const pOffline = storage.getFiltered(storageFilters);

    // Add timeout to online API call to prevent hanging
    // We use a shorter timeout (4000ms) than the global repository timeout (8000ms)
    // so that if the network is slow, we fallback to offline data gracefully
    // before the entire flow gets aborted by the global timeout.
    const timeoutMs = 4000;
    const timeoutPromise = new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error(`Bet API timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    const pOnline = Promise.race([api.list(filters), timeoutPromise]);

    const pTypes = drawRepository.getBetTypes(filters?.drawId || '') as any as Promise<Result<any, any>>;

    const initialContext: GetBetsContext = {
        filters,
        betTypes: [],
        offlineBets: [],
        onlineBets: []
    };

    // 2. ORCHESTRATION (Business Logic Layer)
    return Task.succeed<GetBetsContext, Error>(initialContext)
        .andThen(ctx => resolveMetadata(ctx, pTypes))
        .andThen(ctx => resolveBets(ctx, storage, pOffline, pOnline))
        .andThen(ctx => {
            const res = mergeBets(ctx);
            return res.isOk() ? Task.succeed(res.value) : Task.fail(res.error);
        });
};
