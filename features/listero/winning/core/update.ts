import { match } from 'ts-pattern';
import { WinningModel, WinningMsg, WinningDrawGroup, WinningRecordGroup, ViewType, DateFilter } from './types';
import { initialWinningModel } from './model';
import { Cmd, RemoteData, ret, singleton, Return, Sub } from '@core/tea-utils';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { winningRecordsRepository, WinningRecordEntry } from '@/shared/repositories/winning_records/winning_records.repository';
import { logger } from '@/shared/utils/logger';
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

/**
 * DDD: No recibe structureId - el WinningsRepository lo resuelve
 * internamente desde AuthRepository (Single Source of Truth)
 */
const fetchUserWinningsTask = () => ({
  task: async () => {
    // Repository obtiene structureId desde AuthRepository automáticamente
    const winnings = await winningsRepository.getMyWinnings();
    return winnings
      .filter((bet) => bet.is_winner === true)
      .slice(0, 30);
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
 * Task para obtener todos los winners de la estructura
 * 
 * DDD: Si no se pasa structureId, el repository lo resuelve desde AuthRepository
 */
const fetchAllWinnersTask = (structureId?: string, forceRefresh: boolean = false) => ({
  task: async () => {
      // DDD: Repository resuelve structureId automáticamente si es undefined
      log.debug('Fetching all winners by structure', { structureId, forceRefresh });
      
      log.debug('Calling winningRecordsRepository.getWinnersByStructure', { structureId, days: 30 });
      const entries = await winningRecordsRepository.getWinnersByStructure(structureId, 30);
      log.debug('Received response from getWinnersByStructure', { structureId, entriesCount: entries?.length });
      
      if (!entries || !Array.isArray(entries) || entries.length === 0) {
          log.warn('No valid results in response', { entries });
          return [];
      }
      
      log.debug('Processing grouped records', { structureId, resultsCount: entries.length });
      
      const groupedByDate = groupWinningRecordsByDate(entries);
      
      log.debug('Grouping completed', { structureId, groupsCount: groupedByDate.length });
      
      return groupedByDate;
  },
  onSuccess: (groups: WinningRecordGroup[]) => ({ type: 'FETCH_ALL_WINNERS_SUCCESS' as const, payload: groups }),
  onFailure: (error: Error) => ({ type: 'FETCH_ALL_WINNERS_FAILURE' as const, payload: error.message })
});

/**
 * Agrupa los winning records por fecha
 */
function groupWinningRecordsByDate(entries: WinningRecordEntry[]): WinningRecordGroup[] {
  log.debug('Starting groupWinningRecordsByDate', { entriesCount: entries.length });
  
  const dateMap = new Map<string, WinningRecordGroup>();
  
  for (const entry of entries) {
    const date = entry.date;
    
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        entries: [],
        totalCount: 0,
      });
    }
    
    const group = dateMap.get(date)!;
    group.entries.push(entry);
    group.totalCount = group.entries.length;
  }
  
  const result = Array.from(dateMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  log.debug('Finished groupWinningRecordsByDate', { resultCount: result.length });
  
  return result;
}

function applyFilters(model: WinningModel): any[] {
  const { allWinners, userWinnings, selectedView, selectedDate, dateFilterType, betTypeFilter } = model;
  
  log.debug('applyFilters start', { selectedView, dateFilterType, betTypeFilter, allWinnersType: allWinners.type, userWinningsType: userWinnings.type });
  
  let dataToFilter: any[] = [];
  
  if (selectedView === 'all') {
      if (allWinners.type !== 'Success') return [];
      dataToFilter = allWinners.data;
  } else {
      if (userWinnings.type !== 'Success') return [];
      dataToFilter = groupWinningsByDate(userWinnings.data);
  }
  
  log.debug('applyFilters mid', { dataToFilterLength: dataToFilter.length });

  let filteredGroups = dataToFilter;

  // 1. Filter by date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  log.debug('applyFilters date filtering', { dateFilterType, todayStr });

  if (dateFilterType === 'today') {
      filteredGroups = filteredGroups.filter((group: any) => group.date === todayStr);
  } else if (dateFilterType === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      filteredGroups = filteredGroups.filter((group: any) => group.date === yesterdayStr);
  } else if (dateFilterType === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      filteredGroups = filteredGroups.filter((group: any) => group.date >= weekStartStr);
  }

  // 2. Filter by betType
  log.debug('applyFilters betType filtering', { betTypeFilter });
  if (betTypeFilter !== 'all') {
    if (selectedView === 'all') {
      // WinningRecordGroup
      filteredGroups = filteredGroups
        .map((group: any) => ({
          ...group,
          entries: group.entries.filter((entry: any) => entry.bet_type_code === betTypeFilter),
        }))
        .filter((group: any) => group.entries.length > 0);
    } else {
      // WinningDrawGroup
      filteredGroups = filteredGroups
        .map((group: any) => ({
          ...group,
          winnings: group.winnings.filter((win: any) => win.bet_type_code === betTypeFilter),
        }))
        .filter((group: any) => group.winnings.length > 0);
    }
  }
  
  log.debug('applyFilters result', { count: filteredGroups.length });
  
  return filteredGroups;
}

/**
 * 🎼 INTERNAL HANDLERS
 * Funciones puras que retornan [model, Cmd]
 */
const Handlers = {
  /**
   * Init - Prepara el modelo y dispatch el fetch inicial
   * Por defecto muestra "Todos" (all)
   * 
   * DDD: No necesita passar structureId - el repository lo resuelve internamente
   * desde AuthRepository (Single Source of Truth)
   */
  handleInitModule: (model: WinningModel, structureId?: string): Return<WinningModel, WinningMsg> => {
    const structId = structureId || undefined;  // Repository resolve desde Auth
    const today = new Date().toISOString().split('T')[0];
    
    return ret({ ...model, structureId: structId || model.structureId, selectedDate: today, dateFilterType: 'all' }, Cmd.batch([
      Cmd.task(fetchAllWinnersTask(structId)), // Cargar todos
      Cmd.task(fetchUserWinningsTask()), // DDD: Sin params - repository lo resuelve
      Cmd.task(fetchPendingRewardsCountTask()),
    ]));
  },

  handleDrawsSuccess: (model: WinningModel, payload: WinningDrawGroup[]): Return<WinningModel, WinningMsg> => {
    return ret({ ...model, draws: RemoteData.success(payload) }, Cmd.none);
  },

  handleDrawsFailure: (model: WinningModel, payload: string): Return<WinningModel, WinningMsg> => {
    log.warn('Failed to fetch winning draws', { error: payload });
    return ret({ ...model, draws: RemoteData.failure(payload) }, Cmd.none);
  },

  handleUserWinningsSuccess: (model: WinningModel, payload: WinningBet[]): Return<WinningModel, WinningMsg> => {
    log.debug('User winnings fetched', { count: payload.length });
    const groupedDraws = groupWinningsByDate(payload);
    const nextModel = { 
        ...model, 
        userWinnings: RemoteData.success(payload),
        draws: RemoteData.success(groupedDraws)
    };
    log.debug('handleUserWinningsSuccess calling applyFilters');
    nextModel.filteredData = applyFilters(nextModel);
    log.debug('handleUserWinningsSuccess applyFilters result', { count: nextModel.filteredData.length });
    return ret(nextModel, Cmd.none);
  },

  handleUserWinningsFailure: (model: WinningModel, payload: string): Return<WinningModel, WinningMsg> => {
    log.warn('Failed to fetch user winnings', { error: payload });
    return ret({ ...model, userWinnings: RemoteData.failure(payload) }, Cmd.none);
  },

  handlePendingCountSuccess: (model: WinningModel, payload: number): Return<WinningModel, WinningMsg> => {
    log.debug('Pending rewards count fetched', { count: payload });
    return ret({ ...model, pendingRewardsCount: payload }, Cmd.none);
  },

  handleDateFilterChange: (model: WinningModel, newDate: string, newFilterType: DateFilter): Return<WinningModel, WinningMsg> => {
    log.debug('Date filter changed', { newDate, newFilterType });
    const nextModel = { ...model, selectedDate: newDate, dateFilterType: newFilterType };
    nextModel.filteredData = applyFilters(nextModel);
    
    // Recargar datos con la nueva fecha según la vista actual
    // DDD: fetchUserWinningsTask() no necesita params - repo lo resuelve
    const cmd = model.selectedView === 'all' && model.structureId
      ? Cmd.task(fetchAllWinnersTask(model.structureId))
      : Cmd.task(fetchUserWinningsTask());
    
    return ret(nextModel, cmd);
  },

  handleViewChange: (model: WinningModel, newView: ViewType): Return<WinningModel, WinningMsg> => {
    log.debug('View changed', { newView });
    const nextModel = { ...model, selectedView: newView };
    
    // NO llamar applyFilters aquí - se llamará cuando los datos lleguen
    // Esto evita que filtre datos vacíos cuando userWinnings aún es NotAsked
    
    // DDD: fetchUserWinningsTask() no necesita params - repo lo resuelve
    const cmd = newView === 'all' && model.structureId
      ? Cmd.task(fetchAllWinnersTask(model.structureId))
      : Cmd.task(fetchUserWinningsTask());
    
    return ret(nextModel, cmd);
  },

  handleAllWinnersSuccess: (model: WinningModel, payload: WinningRecordGroup[]): Return<WinningModel, WinningMsg> => {
    log.debug('All winners fetched', { groupsCount: payload.length });
    const nextModel = { ...model, allWinners: RemoteData.success(payload) };
    nextModel.filteredData = applyFilters(nextModel);
    return ret(nextModel, Cmd.none);
  },

  handleAllWinnersFailure: (model: WinningModel, payload: string): Return<WinningModel, WinningMsg> => {
    log.warn('Failed to fetch all winners', { error: payload });
    return ret({ ...model, allWinners: RemoteData.failure(payload) }, Cmd.none);
  },

  handleRefreshWinners: (model: WinningModel): Return<WinningModel, WinningMsg> => {
    log.info('[WinningUpdate] Manejando REFRESH_WINNERS, forzando recarga...');
    if (!model.structureId) return ret(model, Cmd.none);
    
    return ret(
      { ...model, allWinners: RemoteData.loading() },
      Cmd.task(fetchAllWinnersTask(model.structureId, true)) // Force refresh
    );
  },

  handleBetTypeFilterChange: (model: WinningModel, betType: string): Return<WinningModel, WinningMsg> => {
    log.debug('Bet type filter changed', { betType });
    const nextModel = { ...model, betTypeFilter: betType };
    nextModel.filteredData = applyFilters(nextModel);
    return ret(nextModel, Cmd.none);
  },

  reset: (): Return<WinningModel, WinningMsg> => {
    return ret(initialWinningModel, Cmd.none);
  }
};

/**
 * 🔄 UPDATE FUNCTION
 * Función principal que procesa mensajes estilo Elm
 */
export const update = (model: WinningModel, msg: WinningMsg): Return<WinningModel, WinningMsg> => {
  return match<WinningMsg, Return<WinningModel, WinningMsg>>(msg)
    .with({ type: 'INIT_MODULE' }, ({ payload }) => Handlers.handleInitModule(model, payload))

    .with({ type: 'FETCH_WINNING_DRAWS' }, () =>
      RemoteData.fold<unknown, WinningDrawGroup[], Return<WinningModel, WinningMsg>>({
        notAsked: () => ret(
          { ...model, draws: RemoteData.loading() },
          Cmd.task(fetchWinningDrawsTask())
        ),
        loading: () => singleton(model),
        failure: () => ret(
          { ...model, draws: RemoteData.loading() },
          Cmd.task(fetchWinningDrawsTask())
        ),
        success: () => singleton(model)
      }, model.draws)
    )

    .with({ type: 'FETCH_USER_WINNINGS' }, () =>
      RemoteData.fold<unknown, WinningBet[], Return<WinningModel, WinningMsg>>({
        notAsked: () => ret(
          { ...model, userWinnings: RemoteData.loading() },
          Cmd.task(fetchUserWinningsTask())
        ),
        loading: () => singleton(model),
        failure: () => ret(
          { ...model, userWinnings: RemoteData.loading() },
          Cmd.task(fetchUserWinningsTask())
        ),
        success: () => singleton(model)
      }, model.userWinnings)
    )

    .with({ type: 'FETCH_PENDING_REWARDS_COUNT' }, () => 
      ret(model, Cmd.task(fetchPendingRewardsCountTask()))
    )

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

    .with({ type: 'FETCH_PENDING_REWARDS_COUNT_FAILURE' }, () =>
      singleton(model)
    )

    .with({ type: 'FETCH_ALL_WINNING_DATA' }, () =>
      singleton(model)
    )

    .with({ type: 'FETCH_ALL_WINNERS' }, () =>
      RemoteData.fold<unknown, WinningRecordGroup[], Return<WinningModel, WinningMsg>>({
        notAsked: () => {
          if (!model.structureId) return singleton(model);
          return ret(
            { ...model, allWinners: RemoteData.loading() },
            Cmd.task(fetchAllWinnersTask(model.structureId))
          );
        },
        loading: () => singleton(model),
        failure: () => {
          if (!model.structureId) return singleton(model);
          return ret(
            { ...model, allWinners: RemoteData.loading() },
            Cmd.task(fetchAllWinnersTask(model.structureId))
          );
        },
        success: () => singleton(model)
      }, model.allWinners)
    )

    .with({ type: 'FETCH_ALL_WINNERS_SUCCESS' }, ({ payload }) => Handlers.handleAllWinnersSuccess(model, payload))
    .with({ type: 'FETCH_ALL_WINNERS_FAILURE' }, ({ payload }) => Handlers.handleAllWinnersFailure(model, payload))
    .with({ type: 'REFRESH_WINNERS' }, () => Handlers.handleRefreshWinners(model))
    .with({ type: 'CHANGE_VIEW' }, ({ payload }) => Handlers.handleViewChange(model, payload))
    .with({ type: 'CHANGE_DATE_FILTER' }, ({ payload }) =>
      Handlers.handleDateFilterChange(model, payload.date, payload.filterType)
    )
    .with({ type: 'CHANGE_BET_TYPE_FILTER' }, ({ payload }) => Handlers.handleBetTypeFilterChange(model, payload))
    .with({ type: 'RESET' }, () => Handlers.reset())
    .exhaustive();
};
