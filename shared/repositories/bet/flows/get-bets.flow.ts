import { Result, ok, err, okAsync, ResultAsync } from 'neverthrow';
import { BetType, GameType } from '@/types';
import { IBetStorage, IBetApi } from '../bet.ports';
import { ListBetsFilters } from '@/shared/services/bet/types';
import { drawRepository } from '../../draw';
import { isServerReachable } from '@/shared/utils/network';
import { mapBackendBetToFrontend, mapPendingBetsToFrontend } from '@/shared/services/bet/mapper';
import { logger } from '@/shared/utils/logger';

import { toLocalISODate } from '@/shared/utils/formatters';

const log = logger.withTag('GetBetsFlow');

interface GetBetsContext {
    filters?: ListBetsFilters;
    betTypes: GameType[];
    offlineBets: BetType[];
    onlineBets: BetType[];
}

/**
 * Fetches bet types for mapping.
 */
const fetchBetTypes = (ctx: GetBetsContext): ResultAsync<GetBetsContext, Error> => {
    return ResultAsync.fromPromise(
        drawRepository.getBetTypes(ctx.filters?.drawId || ''),
        (e) => e instanceof Error ? e : new Error(String(e))
    ).map((result) => {
        const types = result.isOk()
            ? result.value.map((t): GameType => ({
                id: String(t.id),
                name: t.name,
                code: t.code || '',
                description: t.description || ''
            }))
            : [];
        return { ...ctx, betTypes: types };
    });
};

/**
 * Fetches and maps offline bets.
 * Only pending/error bets are considered.
 */
const fetchOfflineBets = (storage: IBetStorage) => (ctx: GetBetsContext): ResultAsync<GetBetsContext, Error> => {
    return ResultAsync.fromPromise(
        storage.getPending(),
        (e) => e instanceof Error ? e : new Error('Failed to fetch offline bets')
    ).map((allOffline) => {
        const offlineBets = mapPendingBetsToFrontend(allOffline as any, ctx.filters, ctx.betTypes);
        return { ...ctx, offlineBets };
    });
};

/**
 * Fetches and maps online bets if server is reachable.
 */
const fetchOnlineBets = (api: IBetApi) => (ctx: GetBetsContext): ResultAsync<GetBetsContext, Error> => {
    return ResultAsync.fromPromise(
        isServerReachable(),
        () => new Error('Network check failed')
    ).andThen((reachable) => {
        if (!reachable) {
            log.info('Server unreachable, skipping online fetch');
            return okAsync(ctx);
        }

        return ResultAsync.fromPromise(
            api.list(ctx.filters),
            (e) => e instanceof Error ? e : new Error('Failed to fetch online bets')
        ).map((response) => {
            const onlineBets = response
                .map(b => {
                    try { return mapBackendBetToFrontend(b, ctx.betTypes); }
                    catch (e) {
                        log.warn('Mapping error for bet', { betId: b.id, error: e });
                        return null;
                    }
                })
                .filter(Boolean) as BetType[];
            return { ...ctx, onlineBets };
        });
    });
};

/**
 * Merges offline and online bets, deduplicating by receiptCode or id,
 * and applying a final safety filter for date in frontend.
 */
const mergeBets = (ctx: GetBetsContext): Result<BetType[], Error> => {
    const betsMap = new Map<string, BetType>();

    // First add offline bets
    ctx.offlineBets.forEach((bet: BetType) => {
        const key = bet.receiptCode || bet.id;
        if (key && !betsMap.has(key)) {
            betsMap.set(key, bet);
        }
    });

    // Then add online bets (will overwrite offline if same receiptCode)
    ctx.onlineBets.forEach((bet: BetType) => {
        const key = bet.receiptCode || bet.id;
        if (key) {
            betsMap.set(key, bet);
        }
    });

    let result = Array.from(betsMap.values());

    // Safety filter: ensure all merged bets (especially online ones) match the date filter
    if (ctx.filters?.date) {
        const rawDate = ctx.filters.date;
        const filterDate = (typeof rawDate === 'number' || !isNaN(Number(rawDate)))
            ? toLocalISODate(Number(rawDate))
            : String(rawDate);

        log.info('Final safety filter by date', {
            originalFilter: rawDate,
            normalizedFilter: filterDate,
            totalBefore: result.length
        });

        result = result.filter(bet => {
            const betDate = toLocalISODate(bet.timestamp || Date.now());
            const isMatch = betDate === filterDate;

            if (!isMatch) {
                log.warn('Bet excluded by safety filter', {
                    receiptCode: bet.receiptCode,
                    betDate,
                    filterDate,
                    criteria: 'betDate === filterDate'
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
 * Flow for getting bets (Online + Offline merging).
 * Implemented with a declarative chain pattern using neverthrow.
 */
export const getBetsFlow = async (
    storage: IBetStorage,
    api: IBetApi,
    filters?: ListBetsFilters
): Promise<Result<BetType[], Error>> => {
    const initialContext: GetBetsContext = {
        filters,
        betTypes: [],
        offlineBets: [],
        onlineBets: []
    };

    return okAsync(initialContext)
        .andThen(fetchBetTypes)
        .andThen(fetchOfflineBets(storage))
        .andThen(fetchOnlineBets(api))
        .andThen(mergeBets);
};
