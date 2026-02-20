import { BetType } from '@/types';
import { CreateBetDTO, ListBetsFilters } from './bet/types';
import { logger } from '../utils/logger';
import { BetRepository } from '@/shared/repositories/bet.repository';

const log = logger.withTag('BET_SERVICE');

export type { CreateBetDTO } from './bet/types';

/**
 * Bet Service (Adapter Layer)
 * 
 * This service now acts as a thin adapter over the BetRepository.
 * It maintains the existing API surface for the application while
 * delegating all data access logic to the repository layer.
 * 
 * @deprecated Prefer using BetRepository directly in new code.
 */
export class BetService {

    /**
     * Create a new bet with offline-first support
     * Delegates to BetRepository.placeBet
     */
    static async create(betData: CreateBetDTO): Promise<BetType | BetType[]> {
        log.debug('BET_SERVICE.create', { betData });
        
        const result = await BetRepository.placeBet(betData);
        
        if (result.isOk()) {
            return result.value;
        } else {
            log.error('Bet creation failed in repository', result.error);
            throw result.error;
        }
    }

    /**
     * Get all bets (Offline + Online)
     * Delegates to BetRepository.getBets
     */
    static async list(filters?: ListBetsFilters): Promise<BetType[]> {
        log.debug('BET_SERVICE.list', { filters });
        
        const result = await BetRepository.getBets(filters);
        
        if (result.isOk()) {
            return result.value;
        } else {
            log.error('Failed to list bets via repository', result.error);
            // Throwing to allow UI to handle error state, consistent with critical failure
            throw result.error;
        }
    }

    /**
     * Filter bets by Draw ID
     * Delegates to BetRepository.getBets with filter
     */
    static async filterBetsTypeByDrawId(drawId: string): Promise<BetType[]> {
        log.debug('BET_SERVICE.filterBetsTypeByDrawId', { drawId });
        
        // Reuse getBets with filter to include offline bets
        const result = await BetRepository.getBets({ drawId });
        
        if (result.isOk()) {
            return result.value;
        } else {
             log.error('Failed to filter bets by draw', result.error);
             // Return empty array to match previous behavior for simple filters
             return [];
        }
    }
}
