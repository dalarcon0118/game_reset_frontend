import { ExtendedDrawType, DrawClosureConfirmation } from '@/shared/services/draw/types';
import { WinningRecord } from '@/shared/services/winning/types';
import { DrawApi } from './api/api';
import { BackendDraw, BetType, DrawRule } from './api/types/types';
import { mapBackendDrawToFrontend } from '@/shared/services/draw/mapper';
import { DrawOfflineAdapter } from './adapters/draw.offline.adapter';
import { BetOfflineAdapter } from '../bet/adapters/bet.offline.adapter';
import { logger } from '@/shared/utils/logger';
import { Result, ok, err, ResultAsync } from 'neverthrow';
import { isServerReachable } from '@/shared/utils/network';
import { offlineStorage } from '@core/offline-storage/instance';
import { IDrawRepository, DrawFinancialState } from './draw.ports';
import { STORAGE_TTL } from '@core/offline-storage/types';
import { AuthRepository } from '@/shared/repositories/auth';
import { TimerRepository } from '../system/time/tea.repository';

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
    private betOfflineAdapter = new BetOfflineAdapter();

    constructor(
        private api: typeof DrawApi,
        loggerInstance?: SafeLogger
    ) {
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
        
        // Si no se proporciona structureId, obtenerlo directamente del AuthRepository
        if (!structureId) {
            const user = await AuthRepository.getMe();
            structureId = user?.structure?.id?.toString();
            this.log.debug('Auto-obtained structureId from AuthRepository', { structureId });
        }
        
        const forceSync = params.forceSync === true;

        if (!forceSync) {
            const cached = await this.getCachedDraws(structureId);
            if (cached && cached.length > 0) {
                this.log.info('Cache hit: returning valid today draws', { count: cached.length });
                return ok(this.mapDrawsToFrontend(cached, structureId));
            }
        }

        const remoteParams = { ...params };
        delete remoteParams.forceSync;

        const remoteResult = await ResultAsync.fromPromise(isServerReachable(), e => e as Error)
            .andThen(isOnline => isOnline
                ? this.fetchAndCacheRemote(remoteParams, structureId)
                : err(new Error('No internet connection')))
            .map(draws => this.mapDrawsToFrontend(draws, structureId))
            .match(
                (value) => ok<ExtendedDrawType[], Error>(value),
                (error) => err<ExtendedDrawType[], Error>(error)
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
            return ok(this.mapDrawsToFrontend(cachedFallback, structureId));
        }

        return remoteResult;
    }

    async getDraw(id: string | number): Promise<Result<ExtendedDrawType, Error>> {
        const cachedDraw = await this.offlineAdapter.getById(id);
        if (cachedDraw) {
            this.log.info('Cache hit: returning cached draw', { id });
            return ok<ExtendedDrawType, Error>(mapBackendDrawToFrontend(cachedDraw));
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

        return result;
    }

    async getBetTypes(drawId: string | number): Promise<Result<BetType[], Error>> {
        if (!drawId) {
            return ok<BetType[], Error>([]);
        }
        const cachedTypes = await this.offlineAdapter.getBetTypes(drawId);
        if (cachedTypes && cachedTypes.length > 0) {
            this.log.debug('Disco Hit: devolviendo tipos de apuesta instantáneamente', { drawId });
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

        return result;
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

    private mapDrawsToFrontend(draws: BackendDraw[], structureId?: number): ExtendedDrawType[] {
        return draws.map(draw => mapBackendDrawToFrontend({
            ...draw,
            owner_structure: structureId ? Number(structureId) : draw.owner_structure
        }));
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
        this.log.info('Starting DrawRepository Selective Cleanup', { today });

        try {
            let removed = 0;
            await this.offlineAdapter.clearLists();
            const allCachedDraws = await this.offlineAdapter.getAll();
            const toDelete = allCachedDraws.filter(draw => (draw as any).date && (draw as any).date < today);
            const withoutDate = allCachedDraws.filter(draw => !(draw as any).date);
            if (withoutDate.length > 0) {
                this.log.warn(`Found ${withoutDate.length} draws without date field - these will not be cleaned up`, {
                    drawIds: withoutDate.map(d => d.id)
                });
            }
            this.log.debug(`Found ${toDelete.length} old draws to cleanup out of ${allCachedDraws.length} total`, {
                today,
                keeping: allCachedDraws.length - toDelete.length
            });

            for (const draw of toDelete) {
                await this.offlineAdapter.deleteDraw(draw.id);
                removed++;
            }

            const remainingDraws = await this.offlineAdapter.getAll();
            if (remainingDraws.length === 0) {
                await offlineStorage.set(HAS_DRAW_STORAGE_KEY, false);
                this.log.info('hasDraw set to false - no draws remaining after cleanup');
            } else {
                this.log.info(`hasDraw remains true - ${remainingDraws.length} draws remaining after cleanup`);
            }

            this.log.info('DrawRepository Selective Cleanup completed', { removed });
            return removed;

        } catch (error: any) {
            this.log.error('DrawRepository cleanup failed', error);
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
}