import { ExtendedDrawType, DrawClosureConfirmation } from '@/shared/services/draw/types';
import { WinningRecord } from '@/shared/services/winning/types';
import { DrawApi } from './api/api';
import { BackendDraw, BetType, DrawRule } from './api/types/types';
import { mapBackendDrawToFrontend } from '@/shared/services/draw/mapper';
import { DrawOfflineAdapter } from './adapters/draw.offline.adapter';
import { IBetRepository } from '../bet/bet.types';
import { locator } from '@core/utils/locator';
import { logger } from '@/shared/utils/logger';
import { Result, ok, err, ResultAsync } from 'neverthrow';
import { isServerReachable } from '@/shared/utils/network';
import { offlineStorage } from '@core/offline-storage/instance';
import { IDrawRepository, DrawFinancialState, createEmptyDrawFinancialData } from './draw.ports';
import { STORAGE_TTL } from '@core/offline-storage/types';
import { AuthRepository } from '@/shared/repositories/auth';
import { TimerRepository } from '../system/time/tea.repository';
import { TimePolicy } from '../system/time/time.update';

import { toLocalISODate } from '@/shared/utils/formatters';

// Constantes y Predicados puros
const HAS_DRAW_STORAGE_KEY = 'has_draw_available';

const isTodayDraw = (draw: BackendDraw) => {
    const today = toLocalISODate(Date.now());
    const drawLocalDate = toLocalISODate(new Date(draw.draw_datetime).getTime());
    return drawLocalDate === today;
};

interface SafeLogger {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, error?: any, ...args: any[]) => void;
    withTag: (tag: string) => SafeLogger;
    withContext: (context: any) => SafeLogger;
    withStore: (storeId: string) => SafeLogger;
}

export class DrawRepository implements IDrawRepository {
    private log: SafeLogger;
    private offlineAdapter = new DrawOfflineAdapter();
    private _betRepository: IBetRepository | null = null;

    private get betRepository(): IBetRepository {
        if (!this._betRepository) {
            this._betRepository = locator.getSync<IBetRepository>('BetRepository');
        }
        return this._betRepository;
    }

    constructor(
        private api: typeof DrawApi,
        betRepository?: IBetRepository,
        loggerInstance?: SafeLogger
    ) {
        if (betRepository) {
            this._betRepository = betRepository;
        }
        if (loggerInstance) {
            this.log = loggerInstance;
        } else {
            try {
                this.log = logger.withTag('DrawRepository') as SafeLogger;
            } catch (e) {
                this.log = {
                    debug: console.debug.bind(console),
                    info: console.info.bind(console),
                    warn: console.warn.bind(console),
                    error: console.error.bind(console),
                    withContext: () => this.log,
                    withTag: () => this.log,
                    withStore: () => this.log,
                };
            }
        }
    }

    async getDraws(params: Record<string, any> = {}): Promise<Result<ExtendedDrawType[], Error>> {
        let structureId = params.owner_structure;
        const commissionRate = params.commissionRate ??0;

        // DEFENSIVE: Validar structureId y obtenerlo del AuthRepository si es necesario
        const isInvalidStructureId = !structureId || structureId === '0' || structureId === 0;
        
        if (isInvalidStructureId) {
            this.log.warn('[getDraws] structureId inválido o faltante, intentando obtener de AuthRepository', { 
                originalStructureId: structureId,
                isValid: !isInvalidStructureId 
            });
            
            try {
                const user = await AuthRepository.getMe();
                
                this.log.info('[getDraws] AuthRepository.getMe() resultado', { 
                    hasUser: !!user,
                    userId: user?.id,
                    hasStructure: !!user?.structure,
                    structureIdFromUser: user?.structure?.id,
                    structureIdType: typeof user?.structure?.id
                });
                
                if (user?.structure?.id) {
                    structureId = user.structure.id.toString();
                    this.log.info('[getDraws] ✅ structureId obtenido exitosamente de AuthRepository', { 
                        structureId,
                        structureName: user.structure.name 
                    });
                } else {
                    this.log.error('[getDraws] ❌ No se pudo obtener structureId del usuario', { 
                        hasUser: !!user,
                        userKeys: user ? Object.keys(user) : [],
                        structure: user?.structure 
                    });
                }
            } catch (error) {
                this.log.error('[getDraws] ❌ Error al obtener usuario de AuthRepository', { 
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
            }
        }

        // DEFENSIVE: Validación final - si aún no tenemos un structureId válido, retornar error
        const finalValidation = !structureId || structureId === '0' || structureId === 0;
        if (finalValidation) {
            this.log.error('[getDraws] ❌ CRITICAL: No hay structureId válido disponible, no se pueden cargar sorteos', { 
                structureId,
                structureIdType: typeof structureId,
                params: JSON.stringify(params).substring(0, 200)
            });
            return err(new Error('No valid structureId available - cannot fetch draws. User may need to re-authenticate.'));
        }

        this.log.info('[getDraws] ✅ Procediendo a cargar sorteos', { 
            structureId, 
            commissionRate,
            forceSync: params.forceSync === true 
        });

        const forceSync = params.forceSync === true;

        if (!forceSync) {
            const cached = await this.getCachedDraws(structureId);
            if (cached && cached.length > 0) {
                this.log.info('Cache hit: returning valid today draws', { count: cached.length });
                return ok(await this.mapDrawsToFrontend(cached, structureId, commissionRate));
            }
        }

        const remoteParams = { ...params };
        delete remoteParams.forceSync;
        delete remoteParams.commissionRate;

        this.log.info('[getDraws] Starting remote fetch flow', { structureId, remoteParams, forceSync });

        // First build the ResultAsync chain
        const remoteResultAsync = ResultAsync.fromPromise(isServerReachable(), e => e as Error)
            .andThen(isOnline => {
                this.log.debug('[getDraws] Server reachability check', { isOnline });
                return isOnline
                    ? this.fetchAndCacheRemote(remoteParams, structureId)
                    : err(new Error('No internet connection'));
            })
            .andThen(draws => {
                this.log.debug('[getDraws] Mapping draws to frontend', { drawsCount: draws?.length });
                // FIX: mapDrawsToFrontend returns a plain Promise — wrap in ResultAsync.fromPromise
                // so the neverthrow chain contract (andThen expects Result | ResultAsync) is respected.
                // Without this, syncResult has no .match() method → TypeError at runtime.
                return ResultAsync.fromPromise(
                    this.mapDrawsToFrontend(draws, structureId, commissionRate),
                    e => e as Error
                );
            });

        // Await the ResultAsync to get the synchronous Result (not calling .match() on ResultAsync!)
        this.log.debug('[getDraws] Awaiting remoteResultAsync...');
        const syncResult = await remoteResultAsync;
        this.log.info('[getDraws] remoteResultAsync resolved', { 
            isOk: syncResult.isOk(), 
            error: syncResult.isErr() ? syncResult.error.message : null,
            valueType: syncResult.isOk() ? typeof syncResult.value : null
        });

        // Now call .match() on the synchronous Result (valid for neverthrow Result)
        const remoteResult = syncResult.match(
            (value) => {
                this.log.debug('[getDraws] remoteResult match success', { valueCount: value?.length });
                return ok<ExtendedDrawType[], Error>(value);
            },
            (error) => {
                this.log.warn('[getDraws] remoteResult match failure', { error: error.message });
                return err<ExtendedDrawType[], Error>(error);
            }
        );

        if (remoteResult.isOk()) {
            return remoteResult;
        }

        const cachedFallback = await this.getCachedDraws(structureId);
        if (cachedFallback && cachedFallback.length > 0) {
            this.log.warn('Remote failed, falling back to cached draws', {
                reason: remoteResult.isOk() ? 'N/A' : remoteResult.error?.message,
                cachedCount: cachedFallback.length,
                forceSync
            });
            return ok(await this.mapDrawsToFrontend(cachedFallback, structureId, commissionRate));
        }

        return remoteResult;
    }

    async getDraw(id: string | number): Promise<Result<ExtendedDrawType, Error>> {
        const cachedDraw = await this.offlineAdapter.getById(id);
        if (cachedDraw) {
            this.log.info('Cache hit: returning cached draw', { id });
            const mapped = mapBackendDrawToFrontend(cachedDraw);
            
            // DEFENSIVE: Get user and structureId with validation
            let structureId: string | undefined;
            let commissionRate = 0;
            
            try {
                const user = await AuthRepository.getMe();
                if (user?.structure?.id) {
                    structureId = user.structure.id.toString();
                    commissionRate = user.structure.commission_rate ?? 0;
                    this.log.info('[getDraw] Got user structure from AuthRepository', { 
                        structureId, 
                        commissionRate 
                    });
                } else {
                    this.log.warn('[getDraw] No structure found in AuthRepository for draw enrichment');
                }
            } catch (error) {
                this.log.error('[getDraw] Error getting user from AuthRepository', error);
            }
            
            if (structureId) {
                const [enriched] = await this.enrichDrawsWithFinancialData([mapped], structureId, commissionRate);
                return ok(enriched);
            }
            return ok(mapped);
        }

        this.log.info('Cache miss: fetching draw from remote', { id });

        const result = await ResultAsync.fromPromise(this.api.getOne(id), e => e as Error)
            .andThen((draw: BackendDraw) => {
                this.offlineAdapter.saveDraws([draw]);
                return ok<ExtendedDrawType, Error>(mapBackendDrawToFrontend(draw));
            })
            .orElse((apiError: Error) => {
                return ResultAsync.fromPromise(isServerReachable(), e => e as Error)
                    .andThen(isOnline => {
                        return isOnline
                            ? err<ExtendedDrawType, Error>(apiError)
                            : err<ExtendedDrawType, Error>(new Error(`Offline: No se pudo obtener el sorteo ${id} y no está en caché`));
                    });
            });

        if (result.isOk()) {
            const user = await AuthRepository.getMe();
            const structureId = user?.structure?.id?.toString();
            const commissionRate = user?.structure?.commission_rate ?? 0;
            if (structureId) {
                const [enriched] = await this.enrichDrawsWithFinancialData([result.value], structureId, commissionRate);
                return ok(enriched);
            }
        }

        return result;
    }

    async getBetTypes(drawId: string | number): Promise<Result<BetType[], Error>> {
        if (!drawId) {
            return ok<BetType[], Error>([]);
        }
        const cachedTypes = await this.offlineAdapter.getBetTypes(drawId);
        if (cachedTypes && cachedTypes.length > 0) {
            this.log.debug('Disco Hit (fresco): devolviendo tipos de apuesta instantáneamente', { drawId });
            this.backgroundRefreshBetTypes(drawId);
            return ok<BetType[], Error>(cachedTypes);
        }

        this.log.info('No hay caché de tipos de apuesta, iniciando petición de red', { drawId });
        const result = await ResultAsync.fromPromise(isServerReachable(), e => e as Error)
            .andThen(isOnline => isOnline
                ? ResultAsync.fromPromise(this.api.getBetTypes(drawId), e => e as Error)
                : err<BetType[], Error>(new Error(`Offline: Tipos de apuesta no encontrados para sorteo ${drawId}`)))
            .andThen((types: BetType[]) => {
                if (types.length > 0) this.offlineAdapter.saveBetTypes(drawId, types);
                return ok<BetType[], Error>(types);
            });

        if (result.isErr()) {
            this.log.warn('Red fallida y sin caché fresco, intentando con caché expirado', { drawId });
            const staleTypes = await this.offlineAdapter.getBetTypesIncludingStale(drawId);
            if (staleTypes && staleTypes.length > 0) {
                this.log.info('Stale cache hit: devolviendo datos expirados como fallback', { drawId });
                this.backgroundRefreshBetTypes(drawId);
                return ok<BetType[], Error>(staleTypes);
            }
        }

        return result;
    }

    private async backgroundRefreshBetTypes(drawId: string | number, attempt: number = 0): Promise<void> {
        const MAX_ATTEMPTS = 3;
        const BASE_DELAY_MS = 2000;
        if (attempt >= MAX_ATTEMPTS) {
            this.log.debug('backgroundRefreshBetTypes: max attempts reached, aborting', { drawId, attempt });
            return;
        }
        try {
            const isOnline = await isServerReachable();
            if (!isOnline) return;
            const types = await this.api.getBetTypes(drawId);
            if (types.length > 0) this.offlineAdapter.saveBetTypes(drawId, types);
        } catch (e) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            this.log.info('backgroundRefreshBetTypes: attempt failed, retrying', { drawId, attempt, nextDelay: delay });
            await new Promise(resolve => setTimeout(resolve, delay));
            await this.backgroundRefreshBetTypes(drawId, attempt + 1);
        }
    }

    async hasDrawAvailable(skipRemoteFetch: boolean = false): Promise<boolean> {
        this.log.debug('[hasDrawAvailable] Checking local cache for any draws', { skipRemoteFetch });
        try {
            const cachedDraws = await this.getCachedDraws();
            const hasDrawsInCache = cachedDraws.length > 0;
            this.log.debug('[hasDrawAvailable] Cache check result', { hasDrawsInCache, count: cachedDraws.length });

            if (hasDrawsInCache) {
                return true;
            }

            // Si skipRemoteFetch es true, no intentamos fetch remoto (modo offline real)
            if (skipRemoteFetch) {
                this.log.debug('[hasDrawAvailable] Skipping remote fetch (offline mode)');
                return false;
            }

            // If no cache, try remote fetch as fallback for first-time login
            // DEFENSIVA: Sempre usar today=true para evitar traer sorteos históricos
            const remoteResult = await ResultAsync.fromPromise(
                this.api.list({ today: true }),
                (e) => e as Error
            );

            if (remoteResult.isOk() && remoteResult.value.length > 0) {
                const remoteValue = remoteResult.value;
                this.log.debug('[hasDrawAvailable] Remote fetch succeeded, caching results', { count: remoteValue.length });
                await this.offlineAdapter.saveDraws(remoteValue);
                return true;
            }

            this.log.debug('[hasDrawAvailable] No draws available (cache empty, remote unavailable)');
            return false;
        } catch (error) {
            this.log.error('[hasDrawAvailable] Error checking availability', error);
            return false;
        }
    }

    async hasDrawAvailableForStructure(structureId: string | number, skipRemoteFetch: boolean = false): Promise<boolean> {
        this.log.debug('[hasDrawAvailableForStructure] Checking draws for structure', { structureId, skipRemoteFetch });
        try {
            const cachedDraws = await this.getCachedDraws(structureId);
            const hasDrawsInCache = cachedDraws.length > 0;
            this.log.debug('[hasDrawAvailableForStructure] Cache check result', { structureId, hasDrawsInCache, count: cachedDraws.length });

            if (hasDrawsInCache) {
                return true;
            }

            // Si skipRemoteFetch es true, no intentamos fetch remoto (modo offline real)
            if (skipRemoteFetch) {
                this.log.debug('[hasDrawAvailableForStructure] Skipping remote fetch (offline mode)', { structureId });
                return false;
            }

            const remoteResult = await ResultAsync.fromPromise(
                this.api.list({ owner_structure: structureId, today: true }),
                (e) => e as Error
            );

            if (remoteResult.isOk() && remoteResult.value.length > 0) {
                const remoteValue = remoteResult.value;
                this.log.debug('[hasDrawAvailableForStructure] Remote fetch succeeded, caching results', { structureId, count: remoteValue.length });
                await this.offlineAdapter.saveDraws(remoteValue, structureId);
                return true;
            }

            this.log.debug('[hasDrawAvailableForStructure] No draws available for structure (cache empty, remote unavailable)', { structureId });
            return false;
        } catch (error) {
            this.log.error('[hasDrawAvailableForStructure] Error checking availability', error, { structureId });
            return false;
        }
    }

    private fetchAndCacheRemote(params: any, structureId?: number): ResultAsync<BackendDraw[], Error> {
        return ResultAsync.fromPromise(this.api.list(params), e => e as Error)
            .andThen((draws: BackendDraw[]) => {
                if (draws.length > 0) {
                    this.cacheDraws(draws, structureId);
                }
                return ok<BackendDraw[], Error>(draws);
            });
    }

    private async mapDrawsToFrontend(draws: BackendDraw[], structureId?: number, commissionRate?: number): Promise<ExtendedDrawType[]> {
        const mapped = draws.map(draw => mapBackendDrawToFrontend({
            ...draw,
            owner_structure: structureId ? Number(structureId) : draw.owner_structure
        }));

        // Apply financial enrichment (SSOT) - only if we have structureId
        if (structureId) {
            return await this.enrichDrawsWithFinancialData(mapped, String(structureId), commissionRate);
        }

        return mapped;
    }

    async getWinningRecord(drawId: string | number): Promise<Result<WinningRecord | null, Error>> {
        try {
            const isOnline = await isServerReachable();
            let record: WinningRecord | null = null;

            if (isOnline) {
                try {
                    record = await this.api.getWinningRecord(drawId);
                    return ok(record);
                } catch (apiError: any) {
                    const is404 = apiError?.response?.status === 404 ||
                        apiError?.status === 404 ||
                        apiError?.message?.includes('404');

                    if (is404) {
                        this.log.info('No winning numbers found for draw (404)', { drawId });
                        return ok(null);
                    }

                    this.log.warn('Failed to fetch winning record from API', { drawId, error: apiError });
                    return err(apiError instanceof Error ? apiError : new Error(String(apiError)));
                }
            }

            return ok(null);
        } catch (error: any) {
            this.log.error('Error in getWinningRecord', { drawId, error });
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getFinancialState(drawId: string | number): Promise<Result<DrawFinancialState, Error>> {
        return ok({
            drawId: String(drawId),
            lastUpdated: Date.now(),
            local: { totalCollected: 0, totalPaid: 0, netResult: 0, betCount: 0 },
            combined: { totalCollected: 0, totalPaid: 0, netResult: 0, betCount: 0, pendingSync: false }
        });
    }

    async getOne(id: string | number): Promise<BackendDraw> {
        return this.api.getOne(id);
    }

    async list(params?: Record<string, any>): Promise<BackendDraw[]> {
        return this.api.list(params);
    }

    async getRulesForDraw(drawId: string | number): Promise<DrawRule[]> {
        return this.api.getRulesForDraw(drawId);
    }

    async addWinningNumbers(drawId: string | number, data: { winning_number: string; date: string }): Promise<any> {
        return this.api.addWinningNumbers(drawId, data);
    }

    async updateStatus(drawId: string | number, status: 'success' | 'reported'): Promise<void> {
        return this.api.updateStatus(drawId, status);
    }

    async getClosureConfirmationsByDraw(drawId: string | number): Promise<DrawClosureConfirmation[]> {
        return this.api.getClosureConfirmationsByDraw(drawId);
    }

    async createClosureConfirmationsForDraw(
        drawId: string | number,
        data?: { status?: string; notes?: string }
    ): Promise<DrawClosureConfirmation[]> {
        return this.api.createClosureConfirmationsForDraw(drawId, data);
    }

    async confirmClosure(
        confirmationId: number,
        status: 'confirmed_success' | 'reported_issue' | 'rejected',
        notes: string
    ): Promise<DrawClosureConfirmation> {
        return this.api.confirmClosure(confirmationId, status, notes);
    }

    private async cacheDraws(draws: BackendDraw[], structureId?: string | number): Promise<void> {
        await this.offlineAdapter.saveDraws(draws, structureId);
        if (draws.length > 0) {
            await offlineStorage.set(HAS_DRAW_STORAGE_KEY, true);
            this.log.info('hasDraw set to true', { drawCount: draws.length });
        }
    }

    private async getCachedDraws(structureId?: string | number): Promise<BackendDraw[]> {
        return this.offlineAdapter.getAll(structureId);
    }

async cleanup(today: string): Promise<number> {
    this.log.info('[DrawRepository.cleanup] Starting DrawRepository Selective Cleanup', { today });
    try {
      let removed = 0;
      await this.offlineAdapter.clearLists();
      const allCachedDraws = await this.offlineAdapter.getAll();

      // SSOT: Use draw_datetime (actual BackendDraw field) + TimePolicy for consistent date comparison
      const toDelete = allCachedDraws.filter(draw => {
        if (!draw.draw_datetime) {
          this.log.warn('[DrawRepository.cleanup] Draw missing draw_datetime field, cannot determine age', {
            drawId: draw.id
          });
          return false;
        }
        const drawDate = TimePolicy.formatLocalDate(new Date(draw.draw_datetime));
        return drawDate < today;
      });

      const totalFound = allCachedDraws.length;
      const oldDraws = toDelete.length;
      const newDraws = totalFound - oldDraws;

      this.log.info('[DrawRepository.cleanup] Analyzing cached draws for age', {
        today,
        totalCachedDraws: totalFound,
        oldDrawsToDelete: oldDraws,
        newDrawsToKeep: newDraws
      });

      for (const draw of toDelete) {
        this.log.debug('[DrawRepository.cleanup] Deleting old draw', {
          drawId: draw.id,
          drawDatetime: draw.draw_datetime
        });
        await this.offlineAdapter.deleteDraw(draw.id);
        removed++;
      }

      const remainingDraws = await this.offlineAdapter.getAll();
      if (remainingDraws.length === 0) {
        await offlineStorage.set(HAS_DRAW_STORAGE_KEY, false);
        this.log.info('[DrawRepository.cleanup] hasDraw set to false - no draws remaining after cleanup');
      } else {
        this.log.info(`[DrawRepository.cleanup] hasDraw remains true - ${remainingDraws.length} draws remaining after cleanup`);
      }

      this.log.info('[DrawRepository.cleanup] Selective Cleanup completed', {
        removed,
        remaining: remainingDraws.length
      });
      return removed;
    } catch (error: any) {
      this.log.error('[DrawRepository.cleanup] Selective Cleanup failed', error);
      throw error;
}
}

/**
     * ✅ SSOT ÚNICA Y EXCLUSIVA para filtros de sorteos
     * 
     * Single Source of Truth: Toda la lógica de filtros vive AQUÍ y solo AQUÍ
     * Usa tiempo SINCRONIZADO con backend exclusivamente vía TimeRepository
     */
    public filterDraws(
        draws: ExtendedDrawType[],
        filter: any, // Usar StatusFilter una vez migrados todos
        referenceTime?: number
    ): ExtendedDrawType[] {
        const now = referenceTime ?? TimerRepository.getTrustedNow(Date.now());

        const filtered = draws.filter(draw => {
            switch (filter) {
                case 'all':
                    return true;

                case 'open':
                    return this.isBettingOpen(draw, now);

                case 'closed':
                    return this.isExpired(draw, now) ||
                        ['closed', 'completed', 'rewarded'].includes(draw.status);

                case 'scheduled':
                    return this.isScheduled(draw, now);

                case 'closing_soon':
                    return this.isBettingOpen(draw, now) && this.isClosingSoon(draw, now);

                case 'rewarded':
                    return draw.status === 'rewarded' || !!draw.is_rewarded;

                default:
                    return true;
            }
        });

        return this.sortDraws(filtered, now);
    }

    /**
     * ✅ SSOT para determinar si un sorteo está abierto
     * Corrige el bug original del operador <
     */
    private isBettingOpen(draw: ExtendedDrawType, now: number): boolean {
        if (!draw.betting_start_time || !draw.betting_end_time) {
            return false;
        }

        const startTime = new Date(draw.betting_start_time).getTime();
        const endTime = new Date(draw.betting_end_time).getTime();

        // ✅ Bug corregido: ahora usa <= en vez de <
        return now >= startTime && now <= endTime;
    }

    private isExpired(draw: ExtendedDrawType, now: number): boolean {
        if (!draw.betting_end_time) return false;
        return now > new Date(draw.betting_end_time).getTime();
    }

    private isScheduled(draw: ExtendedDrawType, now: number): boolean {
        if (this.isBettingOpen(draw, now) || this.isExpired(draw, now)) {
            return false;
        }

        if (draw.betting_start_time) {
            return now < new Date(draw.betting_start_time).getTime();
        }

        return ['scheduled', 'pending'].includes(draw.status);
    }

    private isClosingSoon(draw: ExtendedDrawType, now: number): boolean {
        if (!draw.betting_end_time) return false;
        const endTime = new Date(draw.betting_end_time).getTime();
        const diff = endTime - now;
        return diff > 0 && diff < 5 * 60 * 1000;
    }

    private sortDraws(draws: ExtendedDrawType[], now: number): ExtendedDrawType[] {
        return [...draws].sort((a, b) => {
            const aOpen = this.isBettingOpen(a, now);
            const bOpen = this.isBettingOpen(b, now);

            if (aOpen && !bOpen) return -1;
            if (!aOpen && bOpen) return 1;

            const aEnd = a.betting_end_time ? new Date(a.betting_end_time).getTime() : Infinity;
            const bEnd = b.betting_end_time ? new Date(b.betting_end_time).getTime() : Infinity;

            return aEnd - bEnd;
        });
    }

    /**
     * ✅ SSOT: Calculate financial data for a draw based on local bets.
     * 
     * REGLA DE NEGOCIO:
     * - totalCollected: LOCAL (pending + synced bets) - supersedes backend
     * - premiumsPaid: BACKEND - only after draw is completed
     * - netResult: CALCULATED = collected - paid - commission
     * - commission: collected * commissionRate
     */
    private calculateDrawFinancialData(
        drawId: string,
        pendingBets: any[],
        syncedBets: any[],
        backendPremiumsPaid: number,
        commissionRate: number
    ): { totalCollected: number; premiumsPaid: number; netResult: number; betCount: number } {
        const safeRate = commissionRate > 1 ? commissionRate / 100 : commissionRate;
        let totalCollected = 0;
        let betCount = 0;

        // Aggregate pending bets
        for (const bet of pendingBets) {
            if (String(bet.drawId) === drawId) {
                totalCollected += Number(bet.amount) || 0;
                betCount++;
            }
        }

        // Aggregate synced bets
        for (const bet of syncedBets) {
            if (String(bet.drawId) === drawId) {
                totalCollected += Number(bet.amount) || 0;
                betCount++;
            }
        }

        const estimatedCommission = totalCollected * safeRate;
        const netResult = totalCollected - backendPremiumsPaid - estimatedCommission;

        return {
            totalCollected,
            premiumsPaid: backendPremiumsPaid,
            netResult,
            betCount
        };
    }

    /**
     * ✅ SSOT: Enriches draws with local financial data.
     * 
     * This method combines:
     * - Local bets (pending + synced) for totalCollected
     * - Backend premiumsPaid (after draw completion)
     * - Calculated netResult using the business formula:
     *   netResult = totalCollected - premiumsPaid - (totalCollected * commissionRate)
     * 
     * @param draws - Array of draws to enrich
     * @param structureId - The structure ID for filtering bets
     * @param commissionRate - Optional commission rate (if not provided, attempts to get from AuthRepository)
     */
    public async enrichDrawsWithFinancialData(
        draws: ExtendedDrawType[],
        structureId: string,
        commissionRate?: number
    ): Promise<ExtendedDrawType[]> {
        // DEFENSIVE: Validate structureId
        if (!structureId || structureId === '0') {
            this.log.warn('[enrichDrawsWithFinancialData] Invalid structureId, returning draws as-is', { structureId });
            return draws;
        }

        if (!draws || draws.length === 0) {
            return draws;
        }

        // Use provided commissionRate or get from AuthRepository
        let rate = commissionRate ?? 0;

        // DEFENSIVE: If no commissionRate provided, try to get from AuthRepository
        if (rate === 0) {
            try {
                const user = await AuthRepository.getMe();
                if (user?.structure?.commission_rate !== undefined) {
                    rate = user.structure.commission_rate;
                    this.log.info('[enrichDrawsWithFinancialData] Got commissionRate from AuthRepository', { 
                        rate, 
                        structureId,
                        userName: user.username 
                    });
                } else {
                    this.log.warn('[enrichDrawsWithFinancialData] Could not get commissionRate from AuthRepository', { 
                        hasUser: !!user,
                        hasStructure: !!user?.structure,
                        commissionRateFromUser: user?.structure?.commission_rate 
                    });
                }
            } catch (error) {
                this.log.error('[enrichDrawsWithFinancialData] Error getting user from AuthRepository', { 
                    error: error instanceof Error ? error.message : String(error) 
                });
            }
        }

        // Get local bets (async)
        let pendingBets: any[] = [];
        let syncedBets: any[] = [];

        try {
            // Use BetRepository abstraction (DIP compliant)
            // DEFENSIVE: Verificar que betRepository este disponible
		if (!this._betRepository) { this._betRepository = locator.getSync<IBetRepository>('BetRepository'); }
		if (!this._betRepository || typeof this._betRepository.getAllRawBets !== 'function') {
			this.log.warn('[enrichDrawsWithFinancialData] BetRepository not available, using empty bets');
		} else {
			const allBets = await this._betRepository.getAllRawBets();
            pendingBets = allBets.filter(bet => bet.status === 'pending' || bet.status === 'error');
            syncedBets = allBets.filter(bet => bet.status === 'synced');
		}
        } catch (error) {
            this.log.error('[enrichDrawsWithFinancialData] Failed to get local bets', error);
        }

        this.log.debug('[enrichDrawsWithFinancialData] Retrieved local bets', {
            pendingCount: pendingBets.length,
            syncedCount: syncedBets.length,
            drawsCount: draws.length,
            commissionRate: rate
        });

        // Enrich each draw with calculated financial data
        return draws.map(draw => {
            const financial = this.calculateDrawFinancialData(
                draw.id,
                pendingBets,
                syncedBets,
                draw.premiumsPaid || 0,
                rate
            );

            return {
                ...draw,
                totalCollected: financial.totalCollected,
                premiumsPaid: financial.premiumsPaid,
                netResult: financial.netResult,
                _financial: {
                    betCount: financial.betCount,
                    estimatedCommission: financial.totalCollected * (rate / 100),
                    isEnriched: true
                }
            } as ExtendedDrawType;
        });
    }
}