import { match } from 'ts-pattern';
import { WinningModel, WinningMsg, WinningDrawGroup } from './types';
import { initialWinningModel } from './model';
import { Cmd, RemoteData, ret, ofMsg } from '@core/tea-utils';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { logger } from '@/shared/utils/logger';
import { Sub } from '@core/tea-utils';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

const log = logger.withTag('WINNING_UPDATE');

export const subscriptions = () => Sub.none();

/**
 * 🛠️ TASK CREATORS
 * Crean tareas asíncronas que retornan mensajes
 * 
 * REFACTOR: Ahora usa BetRepository.getMyWinnings() en lugar de DrawRepository
 * Los winning numbers se obtienen de las apuestas ganadoras del usuario,
 * no del modelo Draw.
 */
const fetchWinningDrawsTask = () => ({
  task: async () => {
    log.debug('Fetching winning draws from BetRepository');
    
    // Obtener apuestas ganadoras del usuario
    const winnings = await winningsRepository.getMyWinnings();
    
    log.debug('BetRepository returned winnings', { count: winnings.length });
    
    // Agrupar por fecha del draw
    const groupedByDate = groupWinningsByDate(winnings);
    
    return groupedByDate;
  },
  onSuccess: (draws: WinningDrawGroup[]) => ({ type: 'FETCH_WINNING_DRAWS_SUCCESS' as const, payload: draws }),
  onFailure: (error: Error) => ({ type: 'FETCH_WINNING_DRAWS_FAILURE' as const, payload: error.message })
});

/**
 * Agrupa las apuestas ganadoras por fecha del sorteo
 */
function groupWinningsByDate(winnings: WinningBet[]): WinningDrawGroup[] {
  const dateMap = new Map<string, WinningDrawGroup>();
  
  for (const win of winnings) {
    if (!win.draw_details?.draw_datetime) continue;
    
    const date = win.draw_details.draw_datetime.split('T')[0]; // YYYY-MM-DD
    
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        drawName: win.draw_details.name,
        winnings: [],
        totalCount: 0,
      });
    }
    
    const group = dateMap.get(date)!;
    group.winnings.push(win);
    group.totalCount = group.winnings.length;
  }
  
  return Array.from(dateMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

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
    const today = new Date().toISOString().split('T')[0];
    const nextModel: WinningModel = {
      draws: RemoteData.loading(),
      userWinnings: RemoteData.loading(),
      pendingRewardsCount: 0,
      selectedDate: today,
    };
    // FIX: Usar Cmd.batch directamente con ofMsg para evitar problemas de inicialización
    return ret(nextModel, Cmd.batch([
      Cmd.task(fetchWinningDrawsTask()),
      Cmd.task(fetchUserWinningsTask()),
      Cmd.task(fetchPendingRewardsCountTask()),
    ]));
  },

  handleDrawsSuccess: (model: WinningModel, payload: WinningDrawGroup[]): [WinningModel, Cmd] => {
    log.debug('Winning draws processed', { 
      groupsCount: payload.length,
      totalWinnings: payload.reduce((acc, g) => acc + g.totalCount, 0)
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

  handleDateFilterChange: (model: WinningModel, newDate: string): [WinningModel, Cmd] => {
    log.debug('Date filter changed', { newDate });
    
    // Recargar datos con la nueva fecha
    return ret({ ...model, selectedDate: newDate }, Cmd.task(fetchWinningDrawsTask()));
  },

  reset: (): [WinningModel, Cmd] => {
    return ret(initialWinningModel, Cmd.none);
  }
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

    .with({ type: 'CHANGE_DATE_FILTER' }, ({ payload }) =>
      Handlers.handleDateFilterChange(model, payload)
    )

    .with({ type: 'RESET' }, () => Handlers.reset())

    .exhaustive();
};
