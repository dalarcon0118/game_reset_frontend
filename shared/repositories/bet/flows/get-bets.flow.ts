import { Result, ok, err, okAsync, ResultAsync } from 'neverthrow';
import { BetType, GameType } from '@/types';
import { IBetStorage, IBetApi } from '../bet.ports';
import { ListBetsFilters } from '@/shared/services/bet/types';
import { drawRepository } from '../../draw';
import { mapBackendBetToFrontend, mapPendingBetsToFrontend } from '@/shared/services/bet/mapper';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '@/shared/repositories/system/time';

const log = logger.withTag('GetBetsFlow');

interface GetBetsContext {
    filters?: ListBetsFilters;
    betTypes: GameType[];
    offlineBets: BetType[];
    onlineBets: BetType[];
}

/**
 * Merges offline and online bets, deduplicating by receiptCode or id,
 * and applying a final safety filter for date in frontend.
 */
const mergeBets = (ctx: GetBetsContext): Result<BetType[], Error> => {
    const betsMap = new Map<string, BetType>();

    // First add offline bets
    ctx.offlineBets.forEach((bet: BetType) => {
        // Use ID for deduplication, NOT receiptCode (multiple bets can share a receiptCode)
        const key = bet.id;
        if (key && !betsMap.has(key)) {
            betsMap.set(key, bet);
        }
    });

    // Then add online bets (will overwrite offline if same ID)
    ctx.onlineBets.forEach((bet: BetType) => {
        const key = bet.id;
        if (key) {
            betsMap.set(key, bet);
        }
    });

    let result = Array.from(betsMap.values());

    // Seguridad: filtrar SOLO por fecha, sin fallback por drawId
    // Si no hay filtro de fecha, devolver todas
    if (ctx.filters?.date) {
        const rawDate = ctx.filters.date;
        const filterDate = (typeof rawDate === 'number' || !isNaN(Number(rawDate)))
            ? TimerRepository.formatUTCDate(Number(rawDate))
            : String(rawDate);

        log.info('Filtering bets by date', {
            originalFilter: rawDate,
            normalizedFilter: filterDate,
            totalBefore: result.length
        });

        result = result.filter(bet => {
            const betDate = TimerRepository.formatUTCDate(bet.timestamp || Date.now());
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

    return ok(result);
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
const resolveMetadata = (ctx: GetBetsContext, pTypes: Promise<Result<any, any>>): ResultAsync<GetBetsContext, Error> => {
    return ResultAsync.fromPromise(
        (async () => {
            // Timeout of 2 seconds for metadata - after that we proceed without it
            const timeoutPromise = new Promise<Result<any, any>>((resolve) =>
                setTimeout(() => resolve(err(new Error('METADATA_TIMEOUT'))), 2000)
            );

            const res = await Promise.race([pTypes, timeoutPromise]);

            const betTypes = res.isOk()
                ? res.value.map(mapToGameType)
                : []; // Fallback to empty list if error or timeout

            if (res.isErr() && res.error.message === 'METADATA_TIMEOUT') {
                log.warn('Metadata fetch timed out, proceeding with degraded mapping');
            }

            return ok({ ...ctx, betTypes });
        })(),
        (e) => e instanceof Error ? e : new Error(String(e))
    ).andThen(res => res);
};

/**
 * RESOLVE BETS: Fetches offline and online bets in parallel.
 * Business logic: Show local data immediately, merge with online data when ready.
 */
const resolveBets = (ctx: GetBetsContext, storage: IBetStorage, pOffline: Promise<any[]>, pOnline: Promise<any[]>): ResultAsync<GetBetsContext, Error> => {
    return ResultAsync.fromPromise(
        (async () => {
            const [offlineRaw, onlineRaw] = await Promise.all([
                pOffline,
                pOnline.catch(e => {
                    log.warn('Online fetch failed, proceeding with offline data only', { error: e });
                    return [] as any[];
                })
            ]);

            let offlineBets = mapPendingBetsToFrontend(offlineRaw as any, ctx.filters, ctx.betTypes);

            // DEEP FALLBACK: If we have a receiptCode but no matches in recent draw cache, search everything
            if (ctx.filters?.receiptCode && offlineBets.length === 0) {
                log.info('ReceiptCode provided but no recent match found. Performing deep storage search.', { receiptCode: ctx.filters.receiptCode });
                const allLocal = await storage.getAll();
                const found = allLocal.filter(b => b.receiptCode === ctx.filters?.receiptCode);

                if (found.length > 0) {
                    log.info('✅ Found match in deep storage search', { count: found.length });
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

            return ok({ ...ctx, offlineBets, onlineBets });
        })(),
        (e) => e instanceof Error ? e : new Error(String(e))
    ).andThen(res => res);
};

/**
 * Flow for getting bets (Online + Offline merging).
 * Architecture: Resilient Pipeline (Parallel Fetch + Sequential Orchestration).
 */
export const getBetsFlow = async (
    storage: IBetStorage,
    api: IBetApi,
    filters?: ListBetsFilters
): Promise<Result<BetType[], Error>> => {
    log.info('Starting GetBetsFlow (Resilient Pipeline)', { filters });

    // 1. PRE-FETCH (Parallel Request Layer)
    // We start all tasks immediately to maximize network/disk usage.
    const pTypes = drawRepository.getBetTypes(filters?.drawId || '');

    // Mejorado: Obtenemos apuestas locales RECIENTES (pendientes + sincronizadas hace poco)
    // para evitar que desaparezcan mientras el backend las indexa.
    const pOffline = storage.getRecentByDraw(filters?.drawId || '');
    const pOnline = api.list(filters);

    const initialContext: GetBetsContext = {
        filters,
        betTypes: [],
        offlineBets: [],
        onlineBets: []
    };

    // 2. ORCHESTRATION (Business Logic Layer)
    // We use a clean chain pattern that consumes the pre-fetched promises.
    return okAsync(initialContext)
        .andThen(ctx => resolveMetadata(ctx, pTypes)) // Metadata as enricher (non-blocking timeout)
        .andThen(ctx => resolveBets(ctx, storage, pOffline, pOnline)) // Core transactional data
        .andThen(mergeBets); // Final deduplication and safety filtering
};
