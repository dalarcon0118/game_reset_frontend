import { RewardModel } from './types';
import { RewardMsg, FETCH_BET_TYPES_REQUESTED, FETCH_BET_TYPES_SUCCEEDED } from './types';
import { Cmd, RemoteData } from '@core/tea-utils';
import { rewardRepository } from '@shared/repositories/reward';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('RewardUpdate');

export const makeUpdate = () => (model: RewardModel, msg: RewardMsg): [RewardModel, any] => {
  if (msg.type !== 'NO_OP') {
    log.debug('[RewardUpdate] Processing message', { 
      msgType: msg.type, 
      payload: (msg as any).payload,
      currentModelStatus: model.betTypes.status.type 
    });
  }

  if (msg.type === 'INIT_MODULE') {
    const structureId = (msg as any).payload?.structureId;
    const nextModel: RewardModel = {
      ...model,
      structureId: structureId || null
    };
    
    return RemoteData.fold({
      notAsked: () => {
        log.debug('[RewardUpdate] INIT: estado notAsked, iniciando fetch');
        return fetchRewardsCmd(nextModel);
      },
      loading: () => {
        log.debug('[RewardUpdate] INIT: estado loading, ignorando');
        return [model, Cmd.none];
      },
      success: () => {
        log.debug('[RewardUpdate] INIT: estado success, ignorando');
        return [model, Cmd.none];
      },
      failure: () => {
        log.debug('[RewardUpdate] INIT: estado failure, reintentando fetch');
        return [
          { ...nextModel, betTypes: { status: RemoteData.loading() } },
          Cmd.task({
            task: async () => {
              const result = await rewardRepository.getBetTypesWithRewards();
              if (result.isErr()) {
                throw result.error;
              }
              return result.value;
            },
            onSuccess: (data) => ({ 
              type: 'FETCH_BET_TYPES_SUCCEEDED' as const, 
              payload: RemoteData.success(data)
            }),
            onFailure: (error) => ({ 
              type: 'FETCH_BET_TYPES_FAILED' as const, 
              payload: RemoteData.failure(error?.message || String(error))
            })
          })
        ];
      }
    }, model.betTypes.status);
  }

  if (msg.type === 'FETCH_BET_TYPES_REQUESTED') {
    return RemoteData.fold({
      notAsked: () => {
        log.debug('[RewardUpdate] FETCH_REQUESTED: notAsked, iniciando fetch');
        return fetchRewardsCmd(model);
      },
      loading: () => {
        log.debug('[RewardUpdate] FETCH_REQUESTED: ya cargando, ignorando');
        return [model, Cmd.none];
      },
      success: () => {
        log.debug('[RewardUpdate] FETCH_REQUESTED: refresh, re-fetch');
        return fetchRewardsCmd(model);
      },
      failure: () => {
        log.debug('[RewardUpdate] FETCH_REQUESTED: reintentando desde failure');
        return fetchRewardsCmd(model);
      }
    }, model.betTypes.status);
  }

  if (msg.type === 'FETCH_BET_TYPES_SUCCEEDED') {
    const webData = (msg as any).payload;
    log.info('[RewardUpdate] FETCH_SUCCEEDED', { 
      webDataType: webData.type,
      hasData: webData.type === 'Success' && webData.data !== null,
      drawTypesCount: webData.data?.draw_types?.length
    });
    return [{ ...model, betTypes: { status: webData } }, Cmd.none];
  }

  if (msg.type === 'FETCH_BET_TYPES_FAILED') {
    const webData = (msg as any).payload;
    log.error('[RewardUpdate] FETCH_FAILED', { 
      webDataType: webData.type,
      error: webData.type === 'Failure' ? webData.error : null
    });
    return [{ ...model, betTypes: { status: webData } }, Cmd.none];
  }

  if (msg.type === 'FETCH_RULES_REQUESTED') {
    return [model, Cmd.none];
  }

  if (msg.type === 'FETCH_REWARDS_REQUESTED') {
    return [model, Cmd.none];
  }

  log.warn('[RewardUpdate] Mensaje no manejado', { msgType: msg.type });
  return [model, Cmd.none];
};

const fetchRewardsCmd = (model: RewardModel): [RewardModel, any] => {
  return [
    { ...model, betTypes: { status: RemoteData.loading() } },
    Cmd.task({
      task: async () => {
        const result = await rewardRepository.getBetTypesWithRewards();
        if (result.isErr()) {
          throw result.error;
        }
        return result.value;
      },
      onSuccess: (data) => ({ 
        type: 'FETCH_BET_TYPES_SUCCEEDED' as const, 
        payload: RemoteData.success(data)
      }),
      onFailure: (error) => ({ 
        type: 'FETCH_BET_TYPES_FAILED' as const, 
        payload: RemoteData.failure(error?.message || String(error))
      })
    })
  ];
};

export const update = makeUpdate();