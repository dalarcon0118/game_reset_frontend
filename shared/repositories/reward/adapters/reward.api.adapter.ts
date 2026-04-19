import { IRewardRepository } from '../reward.ports';
import { apiClient } from '@/shared/services/api_client';
import { BetTypeWithRewardsResponse } from '@/shared/services/draw/types';
import { Result, ok, err } from 'neverthrow';
import { logger } from '@/shared/utils/logger';
import settings from '@/config/settings';

const log = logger.withTag('RewardApiAdapter');

export class RewardApiAdapter implements IRewardRepository {
  async getBetTypesWithRewards(structureId?: number): Promise<Result<BetTypeWithRewardsResponse, Error>> {
    log.info('[RewardApiAdapter]Fetching bet types with rewards', { structureId });

    try {
      // Validar que apiClient esté completamente configurado
      if (!apiClient || typeof apiClient.request !== 'function') {
        const error = new Error('apiClient not configured - request method unavailable');
        log.error('[RewardApiAdapter]apiClient is not properly configured', {
          hasApiClient: !!apiClient,
          hasRequest: apiClient?.request ? true : false,
          error: error.message
        });
        return err(error);
      }

      const params = structureId ? { structure_id: structureId } : {};
      log.debug('[RewardApiAdapter]Making direct API call for bet types with rewards', { params });
      
      const response = await apiClient.get<BetTypeWithRewardsResponse>(
        `${settings.api.endpoints.betTypes()}my-bet-types-with-rewards/`,
        { queryParams: params }
      );
      
      log.info('[RewardApiAdapter]Fetch success', {
        drawTypesCount: response.draw_types?.length,
        bankName: response.bank_name,
        structureId: response.structure_id,
      });
      
      return ok(response);
    } catch (error: any) {
      if (error?.message?.includes('apiClient not configured')) {
        log.error('[RewardApiAdapter]CRITICAL: apiClient not configured', {
          error: error?.message,
          stack: error?.stack,
        });
      } else {
        log.error('[RewardApiAdapter]Fetch failed', {
          error: error?.message,
          stack: error?.stack,
        });
      }
      
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}