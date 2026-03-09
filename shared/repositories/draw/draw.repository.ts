import { ExtendedDrawType, DrawClosureConfirmation } from '@/shared/services/draw/types';
import { DrawApi } from './api/api';
import { BackendDraw, BetType, DrawRule } from './api/types/types';
import { mapBackendDrawToFrontend } from '@/shared/services/draw/mapper';
import { DrawOfflineAdapter } from './adapters/draw.offline.adapter';
import { BetOfflineAdapter } from '../bet/adapters/bet.offline.adapter';
import { logger } from '@/shared/utils/logger';
import { Result, ok, err } from 'neverthrow';
import { isServerReachable } from '@/shared/utils/network';
import { IDrawRepository, DrawFinancialState } from './draw.ports';

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

    // Legacy-compatible methods
    async getDraws(params: Record<string, any> = {}): Promise<Result<ExtendedDrawType[], Error>> {
        try {
            this.log.debug('Getting draws', params);
            const isOnline = await isServerReachable();
            this.log.debug('Server reachable:', isOnline);
            // 1. Obtener datos (Remoto -> Local)
            let backendDraws: BackendDraw[] | null = null;

            if (isOnline) {
                backendDraws = await this.api.list(params)
                    .then(res => {
                        const data = Array.isArray(res) ? res : null;

                        // Si se solicitó una estructura específica, normalizamos el owner_structure
                        // de los sorteos para asegurar consistencia en la caché local (Padre -> Hijo)
                        if (data && params.owner_structure) {
                            return data.map(draw => ({
                                ...draw,
                                owner_structure: Number(params.owner_structure)
                            }));
                        }
                        return data;
                    })
                    .catch(error => {
                        this.log.warn('Online fetch failed, falling back to cache', error);
                        return null;
                    });
                this.log.debug('Fetched draws from server', backendDraws);
                if (backendDraws) await this.cacheDraws(backendDraws, params.owner_structure);
            }

            if (!backendDraws) {
                const cached = await this.getCachedDraws(params.owner_structure);
                if (cached.length > 0) {
                    this.log.info('Returning cached draws from local storage', { count: cached.length });

                    // Si se solicitó una estructura específica, nos aseguramos de que los datos
                    // de la caché (incluso los legacy) tengan el ID correcto
                    if (params.owner_structure) {
                        backendDraws = cached.map(draw => ({
                            ...draw,
                            owner_structure: Number(params.owner_structure)
                        }));
                    } else {
                        backendDraws = cached;
                    }
                } else {
                    this.log.warn('No cached draws available for offline mode');
                }
            }

            // 2. Retornar resultado
            if (backendDraws) {
                // En modo offline, retornamos todos los sorteos cacheados
                // sin filtrar por estructura (el usuario puede necesitar ver sorteos
                // de estructuras relacionadas o dados de alta previamente)
                const isOffline = !isOnline;
                if (isOffline && params.owner_structure) {
                    this.log.info('Offline mode: returning all cached draws without structure filter',
                        { total: backendDraws.length, requestedStructure: params.owner_structure });
                }
                return ok(backendDraws.map(mapBackendDrawToFrontend));
            }

            if (!isOnline) {
                return err(new Error('No internet connection and no cached draws available'));
            }

            return ok([]);

        } catch (error: any) {
            this.log.error('Error getting draws', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getDraw(id: string | number): Promise<Result<ExtendedDrawType, Error>> {
        try {
            const isOnline = await isServerReachable();
            let draw: BackendDraw | null = null;

            if (isOnline) {
                try {
                    draw = await this.api.getOne(id);
                    if (draw) {
                        await this.offlineAdapter.saveDraws([draw]);
                    }
                } catch (apiError) {
                    this.log.warn('Failed to fetch draw from API, checking cache', { id, error: apiError });
                }
            }

            if (!draw) {
                draw = await this.offlineAdapter.getById(id);
                if (draw) {
                    this.log.info('Returning cached draw', { id });
                }
            }

            if (!draw) {
                return err(new Error(`Draw ${id} not found locally or remotely`));
            }

            return ok(mapBackendDrawToFrontend(draw));
        } catch (error: any) {
            this.log.error('Error in getDraw', { id, error });
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getBetTypes(drawId: string | number): Promise<Result<BetType[], Error>> {
        try {
            const isOnline = await isServerReachable();
            let types: BetType[] | null = null;

            if (isOnline) {
                try {
                    types = await this.api.getBetTypes(drawId);
                    if (types) {
                        await this.offlineAdapter.saveBetTypes(drawId, types);
                    }
                } catch (apiError) {
                    this.log.warn('Failed to fetch bet types from API, checking cache', apiError);
                }
            }

            if (!types) {
                types = await this.offlineAdapter.getBetTypes(drawId);
                if (types) {
                    this.log.info('Returning cached bet types', { drawId, count: types.length });
                }
            }

            return ok(types || []);
        } catch (error: any) {
            this.log.error('Error in getBetTypes', error);
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
        this.log.info('Starting DrawRepository cleanup', { today });

        try {
            let removed = 0;

            // 1. Clear the draw list cache (will be refetched from server)
            await this.offlineAdapter.clear();
            removed++;

            this.log.info('DrawRepository cleanup completed', { removed });
            return removed;

        } catch (error: any) {
            this.log.error('DrawRepository cleanup failed', error);
            throw error;
        }
    }
}
