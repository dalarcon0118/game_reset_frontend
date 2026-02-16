import { OfflineFinancialService } from '@/shared/services/offline';
import { CreateBetDTO } from '@/shared/services/bet/types';
import { PendingBetV2 } from '@/shared/services/offline/types';
import { Result, ok, err } from 'neverthrow';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BetRepository');

/**
 * Interface for Bet Repository
 * Abstract the data source (Offline/Online) from the domain logic
 */
export interface IBetRepository {
    placeBet(betData: CreateBetDTO & { commissionRate?: number }): Promise<Result<PendingBetV2, Error>>;

    /**
     * Guarda múltiples apuestas de forma atómica (o lo más cercano posible)
     */
    placeBatch(betsData: (CreateBetDTO & { commissionRate?: number })[]): Promise<Result<PendingBetV2[], Error>>;
}

/**
 * Implementation of Bet Repository that uses OfflineFirst strategy
 */
export class OfflineFirstBetRepository implements IBetRepository {

    async placeBet(betData: CreateBetDTO & { commissionRate?: number }): Promise<Result<PendingBetV2, Error>> {
        try {
            log.debug('Placing bet via repository', betData);
            const result = await OfflineFinancialService.placeBet(betData);
            return ok(result);
        } catch (error: any) {
            log.error('Error placing bet in repository', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async placeBatch(betsData: (CreateBetDTO & { commissionRate?: number })[]): Promise<Result<PendingBetV2[], Error>> {
        try {
            log.debug(`Placing batch of ${betsData.length} bets via repository`);

            // Usamos Promise.all para ejecutar en paralelo pero capturando errores individuales si es necesario
            // Por ahora, si una falla, Promise.all fallará y lanzará el error al catch
            const results = await Promise.all(
                betsData.map(bet => OfflineFinancialService.placeBet(bet))
            );

            return ok(results);
        } catch (error: any) {
            log.error('Error placing batch bets in repository', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
}

// Singleton instance
export const BetRepository = new OfflineFirstBetRepository();
