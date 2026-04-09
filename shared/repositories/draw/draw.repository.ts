import { ExtendedDrawType, DrawClosureConfirmation } from '@/shared/services/draw/types';
import { WinningRecord } from '@/features/listero/bet-workspace/rewards/core/types';
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

import { toLocalISODate } from '@/shared/utils/formatters';

// Constantes y Predicados puros
const HAS_DRAW_STORAGE_KEY = 'has_draw_available';

const isTodayDraw = (draw: BackendDraw) => {
    const today = toLocalISODate(Date.now());
    // Convertimos la fecha del sorteo a local para comparar peras con peras
    const drawLocalDate = toLocalISODate(new Date(draw.draw_datetime).getTime());
    return drawLocalDate === today;
};

// Simple logger interface for type safety
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
        // Safe logger initialization - always use a valid logger instance
        if (loggerInstance) {
            this.log = loggerInstance;
        } else {
            // Use the safe logger from the module
            try {
                this.log = logger.withTag('DrawRepository') as SafeLogger;
            } catch (e) {
                // Final fallback to console
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

    // ============================================================================
    // REPOSITORIO DE SORTEOS (SENIOR IMPLEMENTATION)
    // ============================================================================

    async getDraws(params: Record<string, any> = {}): Promise<Result<ExtendedDrawType[], Error>> {
        const structureId = params.owner_structure;

        // 1. CACHE-FIRST: Intentar obtener de la caché local (Solo sorteos de HOY)
        const cached = await this.getValidCachedDraws(structureId);
        if (cached.isOk() && cached.value.length > 0) {
            this.log.info('Cache hit: returning valid today draws', { count: cached.value.length });
            return ok(this.mapDrawsToFrontend(cached.value, structureId));
        }

        // 2. REMOTE-FALLBACK: Si la caché falla o es vieja, intentar remoto
        return ResultAsync.fromPromise(isServerReachable(), e => e as Error)
            .andThen(isOnline => isOnline
                ? this.fetchAndCacheRemote(params, structureId)
                : err(new Error('No internet connection and no cached draws available')))
            .map(draws => this.mapDrawsToFrontend(draws, structureId));
    }

    async getDraw(id: string | number): Promise<Result<ExtendedDrawType, Error>> {
        // 1. CACHE-FIRST: Intentar obtener de la caché local
        const cachedDraw = await this.offlineAdapter.getById(id);
        if (cachedDraw) {
            this.log.info('Cache hit: returning cached draw', {
                id,
                hasPrizeConfig: !!(cachedDraw as any).prize_config,
                prizeConfig: (cachedDraw as any).prize_config,
                cachedExtraData: (cachedDraw as any).extra_data,
                cachedAllKeys: Object.keys(cachedDraw)
            });
            return ok<ExtendedDrawType, Error>(mapBackendDrawToFrontend(cachedDraw));
        }

        this.log.info('Cache miss: fetching draw from remote', { id });

        // 2. REMOTE-FALLBACK
        const result = await ResultAsync.fromPromise(this.api.getOne(id), e => e as Error)
            .andThen((draw: BackendDraw) => {
                this.log.info('📡 [DEBUG] Remote draw received:', {
                    drawId: draw.id,
                    hasPrizeConfig: !!(draw as any).prize_config,
                    prizeConfig: (draw as any).prize_config,
                    remoteExtraData: (draw as any).extra_data,
                    remoteAllKeys: Object.keys(draw)
                });
                this.offlineAdapter.saveDraws([draw]); // Background save
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
        // 1. DISCO PRIMERO: Retorno inmediato sin chequeos de red ni sesión
        const cachedTypes = await this.offlineAdapter.getBetTypes(drawId);
        if (cachedTypes && cachedTypes.length > 0) {
            this.log.debug('Disco Hit: devolviendo tipos de apuesta instantáneamente', { drawId });
            return ok<BetType[], Error>(cachedTypes);
        }

        // 2. RED SEGUNDO: Solo si no hay caché iniciamos el flujo de red
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

    // ============================================================================
    // MÉTODOS PRIVADOS DE APOYO (ORQUESTACIÓN Y TRANSFORMACIÓN)
    // ============================================================================

    private async getValidCachedDraws(structureId?: number): Promise<Result<BackendDraw[], Error>> {
        try {
            const draws = await this.getCachedDraws(structureId);
            const validDraws = draws.filter(isTodayDraw);
            this.log.debug('getValidCachedDraws evaluation', {
                totalInCache: draws.length,
                validForToday: validDraws.length,
                structureId
            });
            return ok<BackendDraw[], Error>(validDraws);
        } catch (error) {
            return err<BackendDraw[], Error>(error as Error);
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
                } catch (apiError) {
                    this.log.warn('Failed to fetch winning record from API', { drawId, error: apiError });
                }
            }

            return ok(record);
        } catch (error: any) {
            this.log.error('Error in getWinningRecord', { drawId, error });
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getFinancialState(drawId: string | number): Promise<Result<DrawFinancialState, Error>> {
        // Mocked for now, needs real implementation
        return ok({
            drawId: String(drawId),
            lastUpdated: Date.now(),
            local: { totalCollected: 0, totalPaid: 0, netResult: 0, betCount: 0 },
            combined: { totalCollected: 0, totalPaid: 0, netResult: 0, betCount: 0, pendingSync: false }
        });
    }

    // Base methods
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
        // Set hasDraw to true when draws are successfully cached
        if (draws.length > 0) {
            await offlineStorage.set(HAS_DRAW_STORAGE_KEY, true);
            this.log.info('hasDraw set to true', { drawCount: draws.length });
        }
    }

    private async getCachedDraws(structureId?: string | number): Promise<BackendDraw[]> {
        return this.offlineAdapter.getAll(structureId);
    }

    // ============================================================================
    // OPERACIONES DE LIMPIEZA (MANTENIMIENTO)
    // ============================================================================

    /**
     * Cleanup method for prepareDailySessionUseCase.
     * Cleans up old cached draws and lists.
     * 
     * @param today - Fecha actual del servidor (YYYY-MM-DD)
     * @returns Número de keys eliminadas
     */
    async cleanup(today: string): Promise<number> {
        this.log.info('Starting DrawRepository Selective Cleanup', { today });

        try {
            let removed = 0;

            // 1. Limpiar solo la caché de LISTAS.
            // Esto fuerza a la app a pedir datos frescos al servidor, 
            // pero NO borra los sorteos individuales.
            await this.offlineAdapter.clearLists();
            removed++;

            // 2. Obtener todos los sorteos individuales cacheados
            const allCachedDraws = await this.offlineAdapter.getAll();

            // 3. Filtrar y borrar solo los que sean estrictamente anteriores a 'today'
            // La fecha de BackendDraw viene en formato YYYY-MM-DD
            const toDelete = allCachedDraws.filter(draw => (draw as any).date < today);

            this.log.debug(`Found ${toDelete.length} old draws to cleanup out of ${allCachedDraws.length} total`, {
                today,
                keeping: allCachedDraws.length - toDelete.length
            });

            for (const draw of toDelete) {
                await this.offlineAdapter.deleteDraw(draw.id);
                removed++;
            }

            // 4. Verificar si quedan sorteos después de la limpieza
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
     * Verifica si hay sorteos disponibles en la base de datos local.
     * Utilizado por el sistema de autenticación para permitir o denegar login offline.
     * 
     * Primero verifica el flag hasDraw (optimización), luego verifica la caché directamente
     * como fallback para mantener consistencia.
     */
    async hasDrawAvailable(): Promise<boolean> {
        this.log.debug('[hasDrawAvailable] Verificando disponibilidad de sorteos para login offline');
        try {
            const hasDrawFlag = await offlineStorage.get<boolean>(HAS_DRAW_STORAGE_KEY);
            this.log.debug('[hasDrawAvailable] Flag hasDraw storage', { hasDrawFlag });

            if (hasDrawFlag !== true) {
                this.log.info('[hasDrawAvailable] Flag es false/null - denegando login offline', { hasDrawFlag });
                return false;
            }

            const cachedDraws = await this.offlineAdapter.getAll();
            const hasDrawsInCache = cachedDraws.length > 0;
            this.log.debug('[hasDrawAvailable] Cache verificada', {
                cachedDrawsCount: cachedDraws.length,
                hasDrawsInCache
            });

            if (!hasDrawsInCache && hasDrawFlag === true) {
                this.log.warn('[hasDrawAvailable] Inconsistencia detectada: flag true pero cache vacía, corrigiendo flag');
                await offlineStorage.set(HAS_DRAW_STORAGE_KEY, false);
            }

            this.log.info('[hasDrawAvailable] Resultado final', { hasDrawsInCache });
            return hasDrawsInCache;
        } catch (error) {
            this.log.error('[hasDrawAvailable] Error al verificar disponibilidad', error);
            return false;
        }
    }

    async hasDrawAvailableForStructure(structureId: string | number): Promise<boolean> {
        this.log.debug('[hasDrawAvailableForStructure] Verificando sorteos para estructura', { structureId });
        try {
            const cachedDraws = await this.offlineAdapter.getAll(structureId);
            const hasDrawsInCache = cachedDraws.length > 0;
            this.log.info('[hasDrawAvailableForStructure] Resultado', {
                structureId,
                cachedDrawsCount: cachedDraws.length,
                hasDrawsInCache
            });
            return hasDrawsInCache;
        } catch (error) {
            this.log.error('[hasDrawAvailableForStructure] Error al verificar disponibilidad', error);
            return false;
        }
    }
}
