import { BetType } from '@/types';
import { isServerReachable } from '../utils/network';
import { BetApi } from './bet/api';
import { BetOffline } from './bet/offline';
import { mapBackendBetToFrontend } from './bet/mapper';
import { sanitizeCreateBetData } from './bet/sanitizer';
import { CreateBetDTO, ListBetsFilters } from './bet/types';
import { OfflineFinancialService } from './offline';
import { logger } from '../utils/logger';

const log = logger.withTag('BET_SERVICE');

export type { CreateBetDTO } from './bet/types';

export class BetService {

    /**
     * Create a new bet with offline-first support
     * @param betData - The bet data to send to the backend
     * @returns Promise with the created BetType or BetType[]
     */
    static async create(betData: CreateBetDTO): Promise<BetType | BetType[]> {
        log.debug('BET.CREATING', JSON.stringify(betData, null, 2));

        const isOnline = await isServerReachable();
        log.debug('Network state check', { isOnline });

        const sanitizedData = sanitizeCreateBetData(betData);

        // Crear apuesta en sistema offline-first FIRST (antes de cualquier API call)
        log.info('Saving to offline storage (Optimistic)...');

        // Usar el nuevo OfflineFinancialService para tracking financiero
        const pendingFinancialBet = await OfflineFinancialService.placeBet({
            ...sanitizedData,
            commissionRate: 0.1,
        });

        // También mantener compatibilidad con BetOffline legacy
        // USAR EL MISMO ID para evitar duplicados en la lista combinada
        const offlineId = await BetOffline.savePendingBet(sanitizedData, pendingFinancialBet.offlineId);
        const legacyPendingBet = BetOffline.buildPendingBet(sanitizedData, offlineId);

        if (!isOnline) {
            log.info('Offline mode. Returning pending bet.');
            return legacyPendingBet;
        }

        try {
            // Usar idempotency key para prevenir duplicados
            const idempotencyKey = pendingFinancialBet.offlineId;
            const response = await BetApi.createWithIdempotencyKey(sanitizedData, idempotencyKey);
            log.debug('API response received', JSON.stringify(response, null, 2));

            // Éxito: marcar como sincronizada (NO eliminar - se limpia a las 00:00)
            await BetOffline.markAsSynced(offlineId);

            if (Array.isArray(response)) {
                if (response.length === 0) {
                    throw new Error('No se crearon apuestas. El servidor no devolvió datos de confirmación.');
                }
                return response.map(bet => mapBackendBetToFrontend(bet));
            }
            return mapBackendBetToFrontend(response);
        } catch (error: any) {
            log.error('API call failed during bet creation', error);

            // Check if it's a client error (4xx) or server/network error
            const status = error?.status || error?.response?.status;
            const isClientError = status >= 400 && status < 500;

            if (isClientError) {
                log.warn('Client error (Invalid Data). Cancelling pending bet.');
                // Para errores 4xx (datos inválidos), marcamos como error definitivo
                await BetOffline.removePendingBet(offlineId);
                throw error;
            } else {
                log.info('Network/Server error. Bet queued for sync.');
                // Error de red/servidor: la apuesta ya está en cola de sync via OfflineFinancialService
                return legacyPendingBet;
            }
        }
    }

    /**
     * Get all bets from backend
     * @param filters - Optional filters (e.g., drawId, limit, offset)
     * @returns Promise with array of BetType
     */
    static async list(filters?: ListBetsFilters): Promise<BetType[]> {
        let onlineBets: BetType[] = [];
        let offlineBets: BetType[] = [];

        log.debug('Listing bets with filters', { filters });

        try {
            // 1. Obtener apuestas del sistema legacy
            const legacyPendingBets = await BetOffline.getPendingBets();

            // 2. Obtener apuestas del nuevo sistema V2
            const { OfflineFinancialService } = require('./offline');
            const v2PendingBets = await OfflineFinancialService.getPendingBets();

            log.debug('Merging pending bets', {
                legacyCount: legacyPendingBets.length,
                v2Count: v2PendingBets.length,
                legacyIds: legacyPendingBets.map(b => b.offlineId),
                v2Ids: v2PendingBets.map(b => b.offlineId)
            });

            // Combinar y deduplicar por offlineId
            const combinedPending = [...legacyPendingBets];

            v2PendingBets.forEach((v2Bet: any) => {
                const exists = combinedPending.some(b => b.offlineId === v2Bet.offlineId);
                if (!exists) {
                    combinedPending.push(v2Bet);
                } else {
                    log.debug(`Deduplicated bet found in both systems: ${v2Bet.offlineId}`);
                }
            });

            log.debug(`Combined pending bets: ${combinedPending.length} (${legacyPendingBets.length} legacy + ${v2PendingBets.length} v2)`);

            offlineBets = BetOffline.flattenPendingBets(combinedPending, { drawId: filters?.drawId });
        } catch (e) {
            log.warn('Error fetching offline bets', e);
        }

        try {
            log.debug('Calling BetApi.list', { filters });
            const response = await BetApi.list(filters);

            if (!Array.isArray(response)) {
                log.warn('Unexpected response format from BetApi.list (not an array)', { type: typeof response });
            } else {
                log.debug(`API returned ${response.length} bets`);
                onlineBets = response.map(bet => {
                    try {
                        return mapBackendBetToFrontend(bet);
                    } catch (mapError) {
                        log.error('Error mapping individual bet', mapError, { bet });
                        return null;
                    }
                }).filter(Boolean) as BetType[];
            }
        } catch (error) {
            log.error('Error fetching bets from API', error);
        }

        const totalBets = [...offlineBets, ...onlineBets];
        log.info(`Returning total of ${totalBets.length} bets (${offlineBets.length} offline + ${onlineBets.length} online)`);
        return totalBets;
    }

    static async filterBetsTypeByDrawId(drawId: string): Promise<BetType[]> {
        const response = await BetApi.listByDrawId(drawId);
        if (!Array.isArray(response)) return [];
        return response.map(bet => mapBackendBetToFrontend(bet));
    }
}
