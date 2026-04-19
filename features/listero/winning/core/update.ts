import { match } from 'ts-pattern';
import { WinningModel, WinningMsg } from './types';
import { Cmd, RemoteData, ret, ofMsg } from '@core/tea-utils';
import { drawRepository } from '@/shared/repositories/draw';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { logger } from '@/shared/utils/logger';
import { Sub } from '@core/tea-utils';
import { ExtendedDrawType } from '@/shared/services/draw/types';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

const log = logger.withTag('WINNING_UPDATE');

// FIX: Usar ret() en lugar de singleton() para garantizar nuevas referencias
// y evitar bucles infinitos en Zustand

export const subscriptions = () => Sub.none();

/**
 * 🛠️ TASK CREATORS
 * Crean tareas asíncronas que retornan mensajes
 */
const fetchWinningDrawsTask = () => ({
  task: async () => {
    const result = await drawRepository.getDraws({ owner_structure: undefined });
    return result.map(draws =>
      draws.filter((d: any) => d.status === 'closed' && d.winning_numbers)
    );
  },
  onSuccess: (draws: ExtendedDrawType[]) => ({ type: 'FETCH_WINNING_DRAWS_SUCCESS' as const, payload: draws }),
  onFailure: (error: Error) => ({ type: 'FETCH_WINNING_DRAWS_FAILURE' as const, payload: error.message })
});

const fetchUserWinningsTask = () => ({
  task: async () => {
    const winnings = await winningsRepository.getMyWinnings();
    return winnings;
  },
  onSuccess: (winnings: WinningBet[]) => ({ type: 'FETCH_USER_WINNINGS_SUCCESS' as const, payload: winnings }),
  onFailure: (error: Error) => ({ type: 'FETCH_USER_WINNINGS_FAILURE' as const, payload: error.message })
});

const fetchPendingRewardsCountTask = () => ({
  task: async () => {
    const count = await winningsRepository.getPendingRewardsCount();
    return count;
  },
  onSuccess: (count: number) => ({ type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS' as const, payload: count }),
  onFailure: (_error: Error) => ({ type: 'FETCH_PENDING_REWARDS_COUNT_FAILURE' as const, payload: 0 })
});

/**
 * 🎼 INTERNAL HANDLERS
 * Funciones puras que retornan [model, Cmd]
 */
const Handlers = {
  /**
   * Init - Prepara el modelo y dispatch el fetch inicial
   */
  init: (): [WinningModel, Cmd] => {
    const nextModel: WinningModel = {
      draws: RemoteData.loading(),
      userWinnings: RemoteData.loading(),
      pendingRewardsCount: 0,
    };
    // FIX: Usar Cmd.batch directamente con ofMsg para evitar problemas de inicialización
    return ret(nextModel, Cmd.batch([
      Cmd.task(fetchWinningDrawsTask()),
      Cmd.task(fetchUserWinningsTask()),
      Cmd.task(fetchPendingRewardsCountTask()),
    ]));
  },

  handleDrawsSuccess: (model: WinningModel, payload: ExtendedDrawType[]): [WinningModel, Cmd] => {
    // MEJORA 3: Log mejorado con verificación de tipo
    const count = Array.isArray(payload) ? payload.length : (payload ? 1 : 0);
    log.debug('Winning draws fetched', { 
      count,
      isArray: Array.isArray(payload),
      payloadType: typeof payload
    });
    return ret({ ...model, draws: RemoteData.success(payload) }, Cmd.none);
  },

  handleDrawsFailure: (model: WinningModel, payload: string): [WinningModel, Cmd] => {
    log.warn('Failed to fetch winning draws', { error: payload });
    return ret({ ...model, draws: RemoteData.failure(payload) }, Cmd.none);
  },

  handleUserWinningsSuccess: (model: WinningModel, payload: WinningBet[]): [WinningModel, Cmd] => {
    log.debug('User winnings fetched', { count: payload.length });
    return ret({ ...model, userWinnings: RemoteData.success(payload) }, Cmd.none);
  },

  handleUserWinningsFailure: (model: WinningModel, payload: string): [WinningModel, Cmd] => {
    log.warn('Failed to fetch user winnings', { error: payload });
    return ret({ ...model, userWinnings: RemoteData.failure(payload) }, Cmd.none);
  },

  handlePendingCountSuccess: (model: WinningModel, payload: number): [WinningModel, Cmd] => {
    log.debug('Pending rewards count fetched', { count: payload });
    return ret({ ...model, pendingRewardsCount: payload }, Cmd.none);
  },

  reset: (): [WinningModel, Cmd] => {
    return ret(initialWinningModel, Cmd.none);
  }
};

// Modelo inicial para usar en reset
const initialWinningModel: WinningModel = {
  draws: RemoteData.notAsked(),
  userWinnings: RemoteData.notAsked(),
  pendingRewardsCount: 0,
};

/**
 * 🔄 UPDATE FUNCTION
 * Función principal que procesa mensajes estilo Elm
 */
export const update = (model: WinningModel, msg: WinningMsg): [WinningModel, Cmd] => {
  return match<WinningMsg, [WinningModel, Cmd]>(msg)
    .with({ type: 'INIT_MODULE' }, () => Handlers.init())

    .with({ type: 'FETCH_WINNING_DRAWS' }, () =>
      RemoteData.fold({
        notAsked: () => [
          { ...model, draws: RemoteData.loading() },
          Cmd.task(fetchWinningDrawsTask())
        ],
        loading: () => [model, Cmd.none],
        failure: () => [
          { ...model, draws: RemoteData.loading() },
          Cmd.task(fetchWinningDrawsTask())
        ],
        success: () => [model, Cmd.none]
      }, model.draws)
    )

    .with({ type: 'FETCH_USER_WINNINGS' }, () =>
      RemoteData.fold({
        notAsked: () => [
          { ...model, userWinnings: RemoteData.loading() },
          Cmd.task(fetchUserWinningsTask())
        ],
        loading: () => [model, Cmd.none],
        failure: () => [
          { ...model, userWinnings: RemoteData.loading() },
          Cmd.task(fetchUserWinningsTask())
        ],
        success: () => [model, Cmd.none]
      }, model.userWinnings)
    )

    .with({ type: 'FETCH_PENDING_REWARDS_COUNT' }, () => [
      model,
      Cmd.task(fetchPendingRewardsCountTask())
    ])

    .with({ type: 'FETCH_WINNING_DRAWS_SUCCESS' }, ({ payload }) =>
      Handlers.handleDrawsSuccess(model, payload)
    )

    .with({ type: 'FETCH_WINNING_DRAWS_FAILURE' }, ({ payload }) =>
      Handlers.handleDrawsFailure(model, payload)
    )

    .with({ type: 'FETCH_USER_WINNINGS_SUCCESS' }, ({ payload }) =>
      Handlers.handleUserWinningsSuccess(model, payload)
    )

    .with({ type: 'FETCH_USER_WINNINGS_FAILURE' }, ({ payload }) =>
      Handlers.handleUserWinningsFailure(model, payload)
    )

    .with({ type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS' }, ({ payload }) =>
      Handlers.handlePendingCountSuccess(model, payload)
    )

    .with({ type: 'RESET' }, () => Handlers.reset())

    .exhaustive();
};
