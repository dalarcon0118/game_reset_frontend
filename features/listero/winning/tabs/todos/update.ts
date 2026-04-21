import { match } from 'ts-pattern';
import { TodosModel, TodosMsg, WinningRecordGroup, DateFilter } from './types';
import { initialTodosModel } from './model';
import { Cmd, RemoteData, ret, singleton, Return, Sub } from '@core/tea-utils';
import { winningRecordsRepository, WinningRecordEntry } from '@/shared/repositories/winning_records/winning_records.repository';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TODOS_UPDATE');

export const subscriptions = () => Sub.none();

function groupWinningRecordsByDate(entries: WinningRecordEntry[]): WinningRecordGroup[] {
  const dateMap = new Map<string, WinningRecordGroup>();
  
  for (const entry of entries) {
    const date = entry.date;
    
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, entries: [], totalCount: 0 });
    }
    
    const group = dateMap.get(date)!;
    group.entries.push(entry);
    group.totalCount = group.entries.length;
  }
  
  return Array.from(dateMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function applyFilters(model: TodosModel): WinningRecordGroup[] {
  const { allWinners, selectedDate, dateFilterType, betTypeFilter } = model;
  
  if (allWinners.type !== 'Success') return [];
  
  let filteredGroups = allWinners.data;
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
      .map((g) => ({ ...g, entries: g.entries.filter((e) => e.bet_type_code === betTypeFilter) }))
      .filter((g) => g.entries.length > 0);
  }
  
  return filteredGroups;
}

const fetchAllWinnersTask = (structureId?: string, forceRefresh: boolean = false) => ({
  task: async () => {
    const entries = await winningRecordsRepository.getWinnersByStructure(structureId, 30);
    if (!entries?.length) return [];
    return groupWinningRecordsByDate(entries);
  },
  onSuccess: (groups: WinningRecordGroup[]) => ({ type: 'FETCH_ALL_WINNERS_SUCCESS' as const, payload: groups }),
  onFailure: (error: Error) => ({ type: 'FETCH_ALL_WINNERS_FAILURE' as const, payload: error.message })
});

const Handlers = {
  handleInit: (model: TodosModel): Return<TodosModel, TodosMsg> => {
    return ret({ ...model }, Cmd.task(fetchAllWinnersTask()));
  },

  handleAllWinnersSuccess: (model: TodosModel, payload: WinningRecordGroup[]): Return<TodosModel, TodosMsg> => {
    const allBetTypes = payload.flatMap(g => g.entries.map(e => e.bet_type_code));
    const uniqueBetTypes = [...new Set(allBetTypes.filter(Boolean))];
    const updated = { ...model, allWinners: RemoteData.success(payload), configuredBetTypes: uniqueBetTypes } as TodosModel;
    const filtered = applyFilters(updated);
    return ret({ ...updated, filteredData: filtered }, Cmd.none);
  },

  handleAllWinnersFailure: (model: TodosModel, payload: string): Return<TodosModel, TodosMsg> => {
    log.warn('Failed to fetch all winners', { error: payload });
    return ret({ ...model, allWinners: RemoteData.failure(payload) }, Cmd.none);
  },

  handleDateFilterChange: (model: TodosModel, newDate: string, newFilterType: DateFilter): Return<TodosModel, TodosMsg> => {
    const updated = { ...model, selectedDate: newDate, dateFilterType: newFilterType } as TodosModel;
    const filtered = applyFilters(updated);
    return ret({ ...updated, filteredData: filtered }, Cmd.none);
  },

  handleBetTypeFilterChange: (model: TodosModel, betType: string): Return<TodosModel, TodosMsg> => {
    const updated = { ...model, betTypeFilter: betType } as TodosModel;
    const filtered = applyFilters(updated);
    return ret({ ...updated, filteredData: filtered }, Cmd.none);
  },

  handleRefresh: (model: TodosModel): Return<TodosModel, TodosMsg> => {
    return ret({ ...model, allWinners: RemoteData.loading() }, Cmd.task(fetchAllWinnersTask(undefined, true)));
  },

  reset: (): Return<TodosModel, TodosMsg> => {
    return ret(initialTodosModel, Cmd.none);
  }
};

export const update = (model: TodosModel, msg: TodosMsg): Return<TodosModel, TodosMsg> => {
  return match<TodosMsg, Return<TodosModel, TodosMsg>>(msg)
    .with({ type: 'INIT' }, () => Handlers.handleInit(model))

    .with({ type: 'FETCH_ALL_WINNERS' }, () =>
      RemoteData.fold<unknown, WinningRecordGroup[], Return<TodosModel, TodosMsg>>({
        notAsked: () => ret({ ...model, allWinners: RemoteData.loading() }, Cmd.task(fetchAllWinnersTask())),
        loading: () => singleton(model),
        failure: () => ret({ ...model, allWinners: RemoteData.loading() }, Cmd.task(fetchAllWinnersTask())),
        success: () => singleton(model)
      }, model.allWinners)
    )

    .with({ type: 'FETCH_ALL_WINNERS_SUCCESS' }, ({ payload }) =>
      Handlers.handleAllWinnersSuccess(model, payload)
    )

    .with({ type: 'FETCH_ALL_WINNERS_FAILURE' }, ({ payload }) =>
      Handlers.handleAllWinnersFailure(model, payload)
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