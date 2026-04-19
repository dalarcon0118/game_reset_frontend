import { IRewardRepository } from './reward.ports';
import { RewardApiAdapter } from './adapters/reward.api.adapter';
import { RewardOfflineAdapter } from './adapters/reward.offline.adapter';
import { BetTypeWithRewardsResponse } from '@/shared/services/draw/types';
import { Result, ok, err, ResultAsync } from 'neverthrow';
import { isServerReachable } from '@/shared/utils/network';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('RewardRepository');

export class RewardRepository implements IRewardRepository {
  private apiAdapter = new RewardApiAdapter();
  private offlineAdapter = new RewardOfflineAdapter();

  async getBetTypesWithRewards(structureId?: number): Promise<Result<BetTypeWithRewardsResponse, Error>> {
    log.info('[RewardRepository]Getting bet types with rewards', { structureId });

    // 1. Intentar obtener desde caché primero
    const cached = await this.offlineAdapter.getBetTypesWithRewards(structureId);
    if (cached) {
      log.info('[RewardRepository]Cache HIT - returning cached data', {
        structureId,
        drawTypesCount: cached.draw_types?.length
      });
      return ok(cached);
    }

    // 2. Cache miss - obtener desde el servidor
    log.info('[RewardRepository]Cache MISS - fetching from server', { structureId });
    
    return ResultAsync.fromPromise(isServerReachable(), e => e as Error)
      .andThen(isOnline => {
        if (!isOnline) {
          return err<BetTypeWithRewardsResponse, Error>(
            new Error('Offline: No hay conexión y no hay datos en caché')
          );
        }
        return this.apiAdapter.getBetTypesWithRewards(structureId);
      })
      .andThen(data => {
        // 3. Guardar en caché para próxima vez
        this.offlineAdapter.saveBetTypesWithRewards(data, structureId)
          .catch(saveError => {
            log.warn('[RewardRepository]Failed to save to cache', { 
              structureId, 
              error: saveError 
            });
          });
        return ok<BetTypeWithRewardsResponse, Error>(data);
      })
      .match(
        value => ok(value),
        error => {
          log.error('[RewardRepository]Error fetching bet types with rewards', { 
            structureId, 
            error: error.message 
          });
          return err(error);
        }
      );
  }
}
