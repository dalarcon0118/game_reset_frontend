import { match } from 'ts-pattern';
import { MisGanadoresModel, MisGanadoresMsg, WinningDrawGroup, WinningBet, DateFilter } from './types';
import { initialMisGanadoresModel } from './model';
import { Cmd, RemoteData, ret, singleton, Return, Sub } from '@core/tea-utils';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('MIS_GANADORES_UPDATE');

export const subscriptions = () => Sub.none();

function groupWinningsByDate(winnings: WinningBet[]): WinningDrawGroup[] {
  const dateMap = new Map<string, WinningDrawGroup>();
  
  for (const win of winnings) {
    if (!win.draw_details?.draw_datetime) {
      log.warn('groupWinningsByDate: win missing draw_details', { betId: win.id });
      continue;
    }
    
    const date = win.draw_details.draw_datetime.split('T')[0];
    
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

function applyFilters(model: MisGanadoresModel): WinningDrawGroup[] {
  const { draws, selectedDate, dateFilterType, betTypeFilter } = model;
  
  if (draws.type !== 'Success') return [];
  
  let filteredGroups = draws.data;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  if (dateFilterType === 'today') {
    filteredGroups = filteredGroups.filter((g) => g.date === todayStr);
  } else if (dateFilterType === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    filteredGroups = filteredGroups.filter((g) => g.date === yesterdayStr);
  } else if (dateFilterType === 'week') {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    filteredGroups = filteredGroups.filter((g) => g.date >= weekStartStr);
  }
  
  if (betTypeFilter !== 'all') {
    filteredGroups = filteredGroups
      .map((g) => ({ ...g, winnings: g.winnings.filter((w) => w.bet_type_details?.code === betTypeFilter) }))
      .filter((g) => g.winnings.length > 0);
  }
  
  return filteredGroups;
}

const fetchUserWinningsTask = () => ({
  task: async () => {
    const winnings = await winningsRepository.getMyWinnings();
    return winnings.filter((bet) => bet.is_winner === true).slice(0, 30);
  },
  onSuccess: (winnings: WinningBet[]) => ({ type: 'FETCH_USER_WINNINGS_SUCCESS' as const, payload: winnings }),
  onFailure: (error: Error) => ({ type: 'FETCH_USER_WINNINGS_FAILURE' as const, payload: error.message })
});

const fetchWinningDrawsTask = () => ({
  task: async () => {
    const winnings = await winningsRepository.getMyWinnings();
    const grouped = groupWinningsByDate(winnings);
    return grouped;
  },
  onSuccess: (draws: WinningDrawGroup[]) => ({ type: 'FETCH_WINNING_DRAWS_SUCCESS' as const, payload: draws }),
  onFailure: (error: Error) => ({ type: 'FETCH_WINNING_DRAWS_FAILURE' as const, payload: error.message })
});

const fetchPendingRewardsCountTask = () => ({
  task: async () => {
    const count = await winningsRepository.getPendingRewardsCount();
    return count;
  },
  onSuccess: (count: number) => ({ type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS' as const, payload: count }),
  onFailure: (_error: Error) => ({ type: 'FETCH_PENDING_REWARDS_COUNT_FAILURE' as const, payload: 0 })
});

const Handlers = {
  handleInit: (model: MisGanadoresModel): Return<MisGanadoresModel, MisGanadoresMsg> => {
    return ret({ ...model }, Cmd.batch([
      Cmd.task(fetchUserWinningsTask()),
      Cmd.task(fetchPendingRewardsCountTask()),
    ]));
  },

  handleDrawsSuccess: (model: MisGanadoresModel, payload: WinningDrawGroup[]): Return<MisGanadoresModel, MisGanadoresMsg> => {
    return ret({ ...model, draws: RemoteData.success(payload) }, Cmd.none);
  },

  handleDrawsFailure: (model: MisGanadoresModel, payload: string): Return<MisGanadoresModel, MisGanadoresMsg> => {
    log.warn('Failed to fetch winning draws', { error: payload });
    return ret({ ...model, draws: RemoteData.failure(payload) }, Cmd.none);
  },

handleUserWinningsSuccess: (model: MisGanadoresModel, payload: WinningBet[]): Return<MisGanadoresModel, MisGanadoresMsg> => {
    const uniqueBetTypes = [...new Set(
      payload.map(w => w.bet_type_details?.code).filter(Boolean)
    )];
    const groupedDraws = groupWinningsByDate(payload);
    const updated = { 
      ...model, 
      userWinnings: RemoteData.success(payload), 
      draws: RemoteData.success(groupedDraws),
      configuredBetTypes: uniqueBetTypes 
    } as MisGanadoresModel;
    const filtered = applyFilters(updated);
    return ret({ ...updated, filteredData: filtered }, Cmd.none);
  },

  handleUserWinningsFailure: (model: MisGanadoresModel, payload: string): Return<MisGanadoresModel, MisGanadoresMsg> => {
    log.warn('Failed to fetch user winnings', { error: payload });
    return ret({ ...model, userWinnings: RemoteData.failure(payload) }, Cmd.none);
  },

  handlePendingCountSuccess: (model: MisGanadoresModel, _payload: number): Return<MisGanadoresModel, MisGanadoresMsg> => {
    return ret(model, Cmd.none);
  },

  handleDateFilterChange: (model: MisGanadoresModel, newDate: string, newFilterType: DateFilter): Return<MisGanadoresModel, MisGanadoresMsg> => {
    const updated = { ...model, selectedDate: newDate, dateFilterType: newFilterType } as MisGanadoresModel;
    const filtered = applyFilters(updated);
    return ret({ ...updated, filteredData: filtered }, Cmd.none);
  },

  handleBetTypeFilterChange: (model: MisGanadoresModel, betType: string): Return<MisGanadoresModel, MisGanadoresMsg> => {
    const updated = { ...model, betTypeFilter: betType } as MisGanadoresModel;
    const filtered = applyFilters(updated);
    return ret({ ...updated, filteredData: filtered }, Cmd.none);
  },

  handleRefresh: (model: MisGanadoresModel): Return<MisGanadoresModel, MisGanadoresMsg> => {
    return ret(
      { ...model, userWinnings: RemoteData.loading() },
      Cmd.task(fetchUserWinningsTask())
    );
  },

  reset: (): Return<MisGanadoresModel, MisGanadoresMsg> => {
    return ret(initialMisGanadoresModel, Cmd.none);
  }
};

export const update = (model: MisGanadoresModel, msg: MisGanadoresMsg): Return<MisGanadoresModel, MisGanadoresMsg> => {
  return match<MisGanadoresMsg, Return<MisGanadoresModel, MisGanadoresMsg>>(msg)
    .with({ type: 'INIT' }, () => Handlers.handleInit(model))

    .with({ type: 'FETCH_WINNING_DRAWS' }, () =>
      RemoteData.fold<unknown, WinningDrawGroup[], Return<MisGanadoresModel, MisGanadoresMsg>>({
        notAsked: () => ret({ ...model, draws: RemoteData.loading() }, Cmd.task(fetchWinningDrawsTask())),
        loading: () => singleton(model),
        failure: () => ret({ ...model, draws: RemoteData.loading() }, Cmd.task(fetchWinningDrawsTask())),
        success: () => singleton(model)
      }, model.draws)
    )

    .with({ type: 'FETCH_USER_WINNINGS' }, () =>
      RemoteData.fold<unknown, WinningBet[], Return<MisGanadoresModel, MisGanadoresMsg>>({
        notAsked: () => ret({ ...model, userWinnings: RemoteData.loading() }, Cmd.task(fetchUserWinningsTask())),
        loading: () => singleton(model),
        failure: () => ret({ ...model, userWinnings: RemoteData.loading() }, Cmd.task(fetchUserWinningsTask())),
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

    .with({ type: 'CHANGE_DATE_FILTER' }, ({ payload }) =>
      Handlers.handleDateFilterChange(model, payload.date, payload.filterType)
    )

    .with({ type: 'CHANGE_BET_TYPE_FILTER' }, ({ payload }) =>
      Handlers.handleBetTypeFilterChange(model, payload)
    )

    .with({ type: 'REFRESH' }, () => Handlers.handleRefresh(model))
    .with({ type: 'RESET' }, () => Handlers.reset())
    .exhaustive();
};