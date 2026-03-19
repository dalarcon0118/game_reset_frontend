/**
 * Repository para obtener los premios del usuario
 */
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { WinningBet, PendingRewardsCount } from './winnings.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('WINNINGS_REPOSITORY');

export interface IWinningsRepository {
    getMyWinnings(): Promise<WinningBet[]>;
    getMyWinningsByDraw(drawId: string): Promise<WinningBet[]>;
    getPendingRewardsCount(): Promise<number>;
}

export class WinningsApiRepository implements IWinningsRepository {
    /**
     * Obtiene todas las apuestas ganadoras del usuario
     */
    async getMyWinnings(): Promise<WinningBet[]> {
        try {
            log.debug('Fetching all winnings');
            const response = await apiClient.get<WinningBet[]>(
                `${settings.api.endpoints.bets()}my-winnings/`
            );
            return response;
        } catch (error) {
            log.error('Failed to fetch winnings', error);
            throw error;
        }
    }

    /**
     * Obtiene las apuestas ganadoras del usuario para un sorteo específico
     */
    async getMyWinningsByDraw(drawId: string): Promise<WinningBet[]> {
        try {
            log.debug('Fetching winnings for draw', { drawId });
            const response = await apiClient.get<WinningBet[]>(
                `${settings.api.endpoints.bets()}my-winnings/${drawId}/`
            );
            return response;
        } catch (error) {
            log.error('Failed to fetch winnings for draw', { drawId, error });
            throw error;
        }
    }

    /**
     * Obtiene la cantidad de premios pendientes
     */
    async getPendingRewardsCount(): Promise<number> {
        try {
            log.debug('Fetching pending rewards count');
            const response = await apiClient.get<PendingRewardsCount>(
                `${settings.api.endpoints.bets()}pending-rewards-count/`
            );
            return response.pending_count;
        } catch (error) {
            log.error('Failed to fetch pending rewards count', error);
            // En caso de error, retornamos 0 para no bloquear la UI
            return 0;
        }
    }
}

// Instancia singleton del repository
export const winningsRepository = new WinningsApiRepository();
