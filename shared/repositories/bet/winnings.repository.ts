/**
 * Repository para obtener los premios del usuario
 * 
 * DDD Principle: Este repository conoce la estructura del usuario a través de AuthRepository.
 * La UI no necesita pasar structureId - el repository lo resuelve internamente.
 * 
 * Estrategia Offline-First:
 * - forceSync=false (default): Verifica LocalDB primero, luego API si no hay datos
 * - forceSync=true: Fuerza llamada al backend, actualiza LocalDB
 */
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { WinningBet, PendingRewardsCount } from './winnings.types';
import { logger } from '@/shared/utils/logger';
import { AuthRepository } from '@/shared/repositories/auth';
import { winningsOfflineAdapter } from './adapters/winnings.offline.adapter';
import type { User } from '@/shared/repositories/auth/types/types';

const log = logger.withTag('WINNINGS_REPOSITORY');

export type SyncStrategy = 'offline-first' | 'cache-only' | 'network-only';

export interface IWinningsRepository {
    getMyWinnings(ownerStructureId?: string, forceSync?: boolean | SyncStrategy): Promise<WinningBet[]>;
    getMyWinningsByDraw(drawId: string): Promise<WinningBet[]>;
    getPendingRewardsCount(): Promise<number>;
}

async function getUserStructureId(): Promise<string | null> {
    try {
        log.info('getUserStructureId: fetching user profile');
        const user = await AuthRepository.getOfflineProfile();
        log.info('getUserStructureId: user profile result', { hasUser: !!user, structureId: user?.structure?.id, structureName: user?.structure?.name });
        if (user?.structure?.id) {
            return String(user.structure.id);
        }
        log.warn('No structure found in user profile');
        return null;
    } catch (error) {
        log.error('Failed to get user structure', error);
        return null;
    }
}

export class WinningsApiRepository implements IWinningsRepository {
    /**
     * Obtiene todas las apuestas ganadoras del usuario
     * 
     * Estrategia offline-first:
     * - forceSync=true o 'network-only': Llama directo al backend, guarda en LocalDB
     * - forceSync=false o 'offline-first' (default): Verifica LocalDB primero
     * - forceSync='cache-only': Solo retorna cache
     */
    async getMyWinnings(ownerStructureId?: string, forceSync: boolean | SyncStrategy = false): Promise<WinningBet[]> {
        const strategy = typeof forceSync === 'boolean' 
            ? (forceSync ? 'network-only' : 'offline-first') 
            : forceSync;

        const structureId = ownerStructureId || await getUserStructureId();
        
        if (!structureId) {
            log.warn('getMyWinnings: no structureId, fetching from network');
            return this.fetchFromNetwork(structureId);
        }

        switch (strategy) {
            case 'network-only':
                log.info('getMyWinnings: strategy=network-only, fetching from API');
                return this.fetchAndSave(structureId);

            case 'cache-only':
                log.info('getMyWinnings: strategy=cache-only, fetching from offline');
                const cached = await winningsOfflineAdapter.get(structureId);
                return cached || [];

            case 'offline-first':
            default:
                log.info('getMyWinnings: strategy=offline-first, checking offline first');
                const offlineData = await winningsOfflineAdapter.get(structureId);
                
                if (offlineData && offlineData.length > 0) {
                    log.info('getMyWinnings: returning offline data', { count: offlineData.length });
                    return offlineData;
                }
                
                log.info('getMyWinnings: no offline data, fetching from network');
                return this.fetchAndSave(structureId);
        }
    }

    private async fetchAndSave(structureId: string): Promise<WinningBet[]> {
        const data = await this.fetchFromNetwork(structureId);
        if (structureId) {
            await winningsOfflineAdapter.save(data, structureId);
        }
        return data;
    }

    private async fetchFromNetwork(structureId: string | null): Promise<WinningBet[]> {
        try {
            log.debug('Fetching all winnings from network', { ownerStructureId: structureId });
            const params = structureId ? { ownerStructureId: structureId } : {};
            const response = await apiClient.get<WinningBet[]>(
                `${settings.api.endpoints.bets()}my-winnings/`,
                { queryParams: params }
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
            return 0;
        }
    }
}

// Instancia singleton del repository
export const winningsRepository = new WinningsApiRepository();
export type { SyncStrategy };
