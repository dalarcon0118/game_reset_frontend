import { BetTypeWithRewardsResponse } from '@/shared/services/draw/types';
import { Result } from 'neverthrow';

/**
 * Puerto/Interface para el repositorio de premios (BetTypes con Rewards)
 * Implementa el patrón Repository con soporte offline-first
 */
export interface IRewardRepository {
  /**
   * Obtiene los betTypes con premios para la estructura del usuario actual.
   * @param structureId - ID de estructura opcional para filtrar
   */
  getBetTypesWithRewards(structureId?: number): Promise<Result<BetTypeWithRewardsResponse, Error>>;
}