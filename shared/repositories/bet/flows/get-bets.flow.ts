import { Result, Task } from '@/shared/core';
import { BetType, GameType } from '@/types';
import { IBetStorage, IBetApi, ListBetsFilters } from '../bet.types';
import { drawRepository } from '../../draw';
import { mapBackendBetToFrontend, mapPendingBetsToFrontend } from '../bet.mapper.backend';
import { logger } from '@/shared/utils/logger';
import { toUtcISODate } from '@/shared/utils/formatters';
import { buildBetDedupKey } from '../adapters/bet.offline.adapter';

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

/**
 * SSOT-COMPLIANT MERGE: Offline es la UNICA fuente de verdad (SSOT).
 *
 * El storage offline contiene TODOS los datos completos y verificados de la apuesta:
 * - numbers, amount, type, fingerprint, receiptCode, etc.
 *
 * El API online SOLO se usa para actualizar el estado de sincronización (status).
 * NUNCA se sobrescribe datos offline con datos del online.
 *
 * Esta filosofía offline-first garantiza que:
 * 1. Los datos siempre están disponibles (offline es SSOT)
 * 2. El online es solo para status de sync
 * 3. No hay silent errors ni fallbacks - el online es optional
 */
const mergeBets = (ctx: GetBetsContext): Result<Error, BetType[]> => {
    const betsMap = new Map<string, BetType>();

    // OFFLINE ES EL SSOT: Insertar todas las apuestas offline primero
    ctx.offlineBets.forEach((bet: BetType) => {
        const key = buildBetDedupKey(bet);
        betsMap.set(key, bet);
        log.debug('SSOT: Loaded offline bet', { key, hasFingerprint: !!(bet as any).fingerprint });
    });

    // ONLINE SOLO ACTUALIZA STATUS: Para cada apuesta online, solo actualizar el status
    // NUNCA sobrescribir datos offline con datos del online
    ctx.onlineBets.forEach((onlineBet: BetType) => {
        const key = buildBetDedupKey(onlineBet);
        const existingBet = betsMap.get(key);

        if (existingBet) {
            // ONLINE SOLO actualiza el status de sincronización
            // Todos los demás campos permanecen intactos del offline (SSOT)
            const updatedBet: BetType = {
                ...existingBet,
                status: onlineBet.status || existingBet.status,
                isPending: onlineBet.status === 'synced' ? false : existingBet.isPending
            };
            betsMap.set(key, updatedBet);
            log.debug('SSOT: Updated sync status from online', {
                key,
                previousStatus: existingBet.status,
                newStatus: updatedBet.status,
                hadFingerprint: !!(existingBet as any).fingerprint
            });
        } else {
            // El online tiene una apuesta que no existe offline
            // Esto es posible si alguien hizo una apuesta directamente online (sin pasar por offline)
            // En ese caso, aceptamos el dato online tal cual
            betsMap.set(key, onlineBet);
            log.warn('SSOT: Online-only bet (no offline match)', { key });
        }
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

    // Aplicar ordenamiento si esta definido en los filtros
    if (ctx.filters?.sort) {
        const { field, order } = ctx.filters.sort;

        result = [...result].sort((a, b) => {
            try {
                let valueA: any = a[field];
                let valueB: any = b[field];

                // Manejo especial para fechas
                if (field === 'createdAt' || field === 'timestamp') {
                    valueA = new Date(valueA).getTime();
                    valueB = new Date(valueB).getTime();
                }

                if (order === 'asc') {
                    return valueA > valueB ? 1 : -1;
                } else {
                    return valueB > valueA ? 1 : -1;
                }
            } catch (e) {
                // En caso de error, mantener orden original
                return 0;
            }
        });
    }

    log.info('GetBetsFlow result', {
        total: result.length,
        offline: ctx.offlineBets.length,
        online: ctx.onlineBets.length,
        filter: ctx.filters?.date || 'none',
        sort: ctx.filters?.sort ? `${ctx.filters.sort.field}:${ctx.filters.sort.order}` : 'none'
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
    const timeoutMs = 1000;
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

const buildStorageFilters = (filters?: ListBetsFilters): any => {
    const storageFilters: any = {};
    if (filters?.drawId) storageFilters.drawId = filters.drawId;
    if (filters?.receiptCode) storageFilters.receiptCode = filters.receiptCode;
    if (filters?.date) {
        storageFilters.date = typeof filters.date === 'number'
            ? filters.date
            : new Date(filters.date).getTime();
    }
    return storageFilters;
};

const fetchOnlineWithTimeout = async (
    api: IBetApi,
    filters: ListBetsFilters | undefined,
    timeoutMs: number
): Promise<any[]> => {
    const timeoutPromise = new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error(`Online timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    try {
        return await Promise.race([api.list(filters), timeoutPromise]);
    } catch (e) {
        const isTimeout = e?.message?.includes('timeout');
        log[isTimeout ? 'info' : 'warn']('Online fetch failed', { error: e?.message });
        return [];
    }
};

const fetchTypesWithTimeout = async (
    drawId: string,
    timeoutMs: number
): Promise<GameType[]> => {
    try {
        const timeoutPromise = new Promise<Result<any, any>>((resolve) =>
            setTimeout(() => resolve(Result.error(new Error('Types timeout'))), timeoutMs)
        );
        const res = await Promise.race([
            drawRepository.getBetTypes(drawId || ''),
            timeoutPromise
        ]);
        if (res.isOk()) {
            return (res.value as any[]).map(mapToGameType);
        }
    } catch (e) {
        log.warn('Types fetch failed', { error: e?.message });
    }
    return [];
};

export interface HydratedBets {
    bets: BetType[];
    isFromOnline: boolean;
    timestamp: number;
}

/**
 * getBetsOfflineFirst - Hidratación en background con datos offline inmediatos.
 * 
 * Estrategia:
 * 1. YIELD 1: Retorna inmediatamente con datos del storage local (~50ms)
 * 2. BACKGROUND: Hace fetch online en paralelo (timeout 1s)
 * 3. YIELD 2: Cuando la API responde, retorna datos mergeados (offline + online status)
 * 
 * El caller recibe datos inmediatos para renderizar, y luego recibe actualización
 * cuando la API responde sin bloquear el thread principal.
 */
export const getBetsOfflineFirst = async function* (
    storage: IBetStorage,
    api: IBetApi,
    filters?: ListBetsFilters
): AsyncGenerator<HydratedBets, void, unknown> {
    log.info('getBetsOfflineFirst starting', { filters });

    // YIELD 1: Offline inmediatamente - no esperamos nada más
    const storageFilters = buildStorageFilters(filters);
    const offlineBetsRaw = await storage.getFiltered(storageFilters);
    const onlineIdentitySets = buildOnlineIdentitySets([]);

    const reconciledOffline = (offlineBetsRaw as any[]).filter((bet: any) =>
        shouldKeepOfflineBet(bet, onlineIdentitySets)
    );
    const offlineBets = mapPendingBetsToFrontend(reconciledOffline, filters, []);

    log.info('getBetsOfflineFirst YIELD 1 (offline)', { count: offlineBets.length });
    yield {
        bets: offlineBets as BetType[],
        isFromOnline: false,
        timestamp: Date.now()
    };

    // BACKGROUND: Fetch online y types en paralelo (no bloquea)
    const [onlineBetsRaw, betTypes] = await Promise.all([
        fetchOnlineWithTimeout(api, filters, 1000),
        fetchTypesWithTimeout(filters?.drawId || '', 1000)
    ]);

    // Merge: Offline es SSOT, online solo actualiza status
    const ctx: GetBetsContext = {
        filters,
        betTypes,
        offlineBets: offlineBets as BetType[],
        onlineBets: []
    };

    // Map online bets
    const onlineMapped = (onlineBetsRaw as any[])
        .map((b: any) => {
            try { return mapBackendBetToFrontend(b, betTypes); }
            catch (e) {
                log.warn('Mapping error for bet', { betId: b.id, error: e });
                return null;
            }
        })
        .filter(Boolean) as BetType[];

    ctx.onlineBets = onlineMapped;

    const mergedResult = mergeBets(ctx);
    const mergedBets = mergedResult.isOk() ? mergedResult.value : ctx.offlineBets;

    log.info('getBetsOfflineFirst YIELD 2 (merged)', {
        count: mergedBets.length,
        fromOnline: onlineMapped.length
    });

    yield {
        bets: mergedBets,
        isFromOnline: true,
        timestamp: Date.now()
    };
};
