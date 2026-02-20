import { BetType } from '@/types';
import { CreateBetDTO, ListBetsFilters } from '@/shared/services/bet/types';
import { OfflineFinancialService } from '@/shared/services/offline';
import { BetApi } from '@/shared/services/bet/api';
import { mapBackendBetToFrontend, mapPendingBetsToFrontend, mapSinglePendingBetToFrontend } from '@/shared/services/bet/mapper';
import { sanitizeCreateBetData } from '@/shared/services/bet/sanitizer';
import { isServerReachable } from '@/shared/utils/network';
import { Result, ok, err } from 'neverthrow';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BetRepository');

/**
 * Interface for Bet Repository
 * Abstract the data source (Offline/Online) from the domain logic
 * Returns Domain Models (BetType) ready for UI consumption
 */
export interface IBetRepository {
    placeBet(betData: CreateBetDTO & { commissionRate?: number }): Promise<Result<BetType | BetType[], Error>>;
    getBets(filters?: ListBetsFilters): Promise<Result<BetType[], Error>>;
}

/**
 * Implementation of Bet Repository that uses OfflineFirst strategy
 * Centralizes Online/Offline logic, hiding it from Services/UI.
 */
export class OfflineFirstBetRepository implements IBetRepository {

    async placeBet(betData: CreateBetDTO & { commissionRate?: number }): Promise<Result<BetType | BetType[], Error>> {
        try {
            log.debug('Placing bet via repository', betData);
            
            const sanitizedData = sanitizeCreateBetData(betData);
            const isOnline = await isServerReachable();

            // 1. Optimistic Save: Guardar en OfflineFinancialService (V2)
            // Esto asegura que la apuesta existe localmente y se encola para sync
            const pendingFinancialBet = await OfflineFinancialService.placeBet({
                ...sanitizedData,
                commissionRate: betData.commissionRate ?? 0.1,
            });

            // Si estamos offline, retornamos la versión mapeada inmediatamente
            if (!isOnline) {
                log.info('Offline mode. Returning pending bet.');
                return ok(mapSinglePendingBetToFrontend(pendingFinancialBet));
            }

            // 2. Online Sync: Intentar enviar a la API inmediatamente
            try {
                const idempotencyKey = pendingFinancialBet.offlineId;
                const response = await BetApi.createWithIdempotencyKey(sanitizedData, idempotencyKey);
                
                log.info('Online sync successful');
                
                if (Array.isArray(response)) {
                    if (response.length === 0) throw new Error('No bets created by backend');
                    return ok(response.map(mapBackendBetToFrontend));
                }
                return ok(mapBackendBetToFrontend(response));

            } catch (apiError: any) {
                log.warn('Online sync failed, falling back to offline', apiError);
                
                const status = apiError?.status || apiError?.response?.status;
                const isClientError = status >= 400 && status < 500;

                if (isClientError) {
                    // Si el servidor rechaza los datos (400), es un error definitivo.
                    return err(apiError);
                }

                // Errores de red: Retornamos la versión offline como éxito temporal.
                return ok(mapSinglePendingBetToFrontend(pendingFinancialBet));
            }

        } catch (error: any) {
            log.error('Error placing bet in repository', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getBets(filters?: ListBetsFilters): Promise<Result<BetType[], Error>> {
        try {
            log.debug('Getting bets via repository', { filters });
            
            let onlineBets: BetType[] = [];
            let offlineBets: BetType[] = [];

            // 1. Get Offline Bets (V2)
            try {
                const pendingBets = await OfflineFinancialService.getPendingBets();
                offlineBets = mapPendingBetsToFrontend(pendingBets, filters);
            } catch (e) {
                log.error('Failed to fetch offline bets', e);
            }

            // 2. Get Online Bets (API)
            try {
                if (await isServerReachable()) {
                    const response = await BetApi.list(filters);
                    if (Array.isArray(response)) {
                        onlineBets = response
                            .map(b => {
                                try { return mapBackendBetToFrontend(b); }
                                catch (e) { 
                                    log.error('Mapping error', e);
                                    return null; 
                                }
                            })
                            .filter(Boolean) as BetType[];
                    }
                }
            } catch (e) {
                log.warn('Failed to fetch online bets', e);
            }

            // 3. Merge results
            // Filter duplicates by ID (prefer online version if conflict?)
            // Usually online bets have standard IDs, offline have 'offline-xyz'.
            // They shouldn't overlap in IDs unless we mapped them weirdly.
            
            const totalBets = [...offlineBets, ...onlineBets];
            log.info(`Returning ${totalBets.length} bets (${offlineBets.length} offline + ${onlineBets.length} online)`);
            
            return ok(totalBets);

        } catch (error: any) {
            log.error('Error getting bets in repository', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
}

// Singleton instance
export const BetRepository = new OfflineFirstBetRepository();
