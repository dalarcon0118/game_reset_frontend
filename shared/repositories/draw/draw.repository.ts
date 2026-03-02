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

// Reutilizamos el tipo del logger con tag para el constructor
type TaggedLogger = ReturnType<typeof logger.withTag>;

export class DrawRepository implements IDrawRepository {
    private log: TaggedLogger;
    private offlineAdapter = new DrawOfflineAdapter();
    private betOfflineAdapter = new BetOfflineAdapter();

    constructor(
        private api: typeof DrawApi,
        loggerInstance?: TaggedLogger
    ) {
        this.log = loggerInstance || logger.withTag('DrawRepository');
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
                    .then(res => Array.isArray(res) ? res : null)
                    .catch(error => {
                        this.log.warn('Online fetch failed, falling back to cache', error);
                        return null;
                    });
                this.log.debug('Fetched draws from server', backendDraws);
                if (backendDraws) await this.cacheDraws(backendDraws);
            }

            if (!backendDraws) {
                const cached = await this.getCachedDraws();
                if (cached.length > 0) {
                    this.log.info('Returning cached draws from local storage');
                    backendDraws = cached;
                }
            }

            // 2. Retornar resultado
            if (backendDraws) {
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
            const draw = await this.api.getOne(id);
            return ok(mapBackendDrawToFrontend(draw));
        } catch (error: any) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getBetTypes(drawId: string | number): Promise<Result<BetType[], Error>> {
        try {
            const types = await this.api.getBetTypes(drawId);
            return ok(types);
        } catch (error: any) {
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

    private async cacheDraws(draws: BackendDraw[]): Promise<void> {
        await this.offlineAdapter.saveDraws(draws);
    }

    private async getCachedDraws(): Promise<BackendDraw[]> {
        return this.offlineAdapter.getAll();
    }
}
