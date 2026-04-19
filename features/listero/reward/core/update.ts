import { RewardModel } from './types';
import { RewardMsg, FETCH_BET_TYPES_REQUESTED, FETCH_BET_TYPES_SUCCEEDED } from './types';
import { Cmd, RemoteData } from '@core/tea-utils';
import { rewardRepository } from '@shared/repositories/reward';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('RewardUpdate');

/**
 * 🎼 REWARD UPDATE (Orchestrator)
 * Función pura que orquest la lógica del módulo.
 * Usa el patrón RemoteData.fold para procesar el fetch DENTRO del update.
 */
export const makeUpdate = () => (model: RewardModel, msg: RewardMsg): [RewardModel, any] => {
  // Debug: ver todos los mensajes que llegan
  if (msg.type !== 'NO_OP') {
    log.debug('[RewardUpdate] Processing message', { 
      msgType: msg.type, 
      payload: msg.payload,
      currentModelStatus: model.betTypes.status._tag 
    });
  }

  // INIT_MODULE - Inicializa el módulo y solicita los bet types
  if (msg.type === 'INIT_MODULE') {
    const structureId = msg.payload?.structureId;
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
              payload: { 
                _tag: 'Success' as const,
                data 
              } 
            }),
            onFailure: (error) => ({ 
              type: 'FETCH_BET_TYPES_FAILED' as const, 
              payload: { 
                _tag: 'Failure' as const,
                error: error?.message || String(error)
              } 
            })
          })
        ];
      }
    }, model.betTypes.status);
  }

  // FETCH_BET_TYPES_REQUESTED - Solicitud explícita del usuario
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

  // FETCH_BET_TYPES_SUCCEEDED - Respuesta exitosa del fetch
  if (msg.type === 'FETCH_BET_TYPES_SUCCEEDED') {
    const webData = msg.payload;
    log.info('[RewardUpdate] FETCH_SUCCEEDED', { 
      webDataTag: webData._tag,
      hasData: webData._tag === 'Success' && webData.data !== null,
      drawTypesCount: webData.data?.draw_types?.length
    });
    return [{ ...model, betTypes: { status: webData } }, Cmd.none];
  }

  // FETCH_BET_TYPES_FAILED - Error del fetch
  if (msg.type === 'FETCH_BET_TYPES_FAILED') {
    const webData = msg.payload;
    log.error('[RewardUpdate] FETCH_FAILED', { 
      webDataTag: webData._tag,
      error: webData._tag === 'Failure' ? webData.error : null
    });
    return [{ ...model, betTypes: { status: webData } }, Cmd.none];
  }

  return [model, Cmd.none];
};

// Efecto puro para llamar al repositorio
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
        payload: { 
          _tag: 'Success' as const,
          data 
        } 
      }),
      onFailure: (error) => ({ 
        type: 'FETCH_BET_TYPES_FAILED' as const, 
        payload: { 
          _tag: 'Failure' as const,
          error: error?.message || String(error)
        } 
      })
    })
  ];
};

export type RewardUpdate = 'update';
