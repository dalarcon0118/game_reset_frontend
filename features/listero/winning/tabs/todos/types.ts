import { RemoteData } from '@core/tea-utils';
import { WinningRecordEntry } from '@/shared/repositories/winning_records/winning_records.repository';

export interface WinningRecordGroup {
  date: string;
  entries: WinningRecordEntry[];
  totalCount: number;
}

export type AllWinnersStatus = RemoteData<string, WinningRecordGroup[]>;

export type DateFilter = 'today' | 'yesterday' | 'week' | 'all';

export interface TodosModel {
  allWinners: AllWinnersStatus;
  selectedDate: string;
  dateFilterType: DateFilter;
  structureId: string | null;
  configuredBetTypes: string[];
  betTypeFilter: string;
  filteredData: WinningRecordGroup[];
}

export type TodosMsg =
  | { type: 'INIT'; payload?: string }
  | { type: 'FETCH_ALL_WINNERS' }
  | { type: 'FETCH_ALL_WINNERS_SUCCESS'; payload: WinningRecordGroup[] }
  | { type: 'FETCH_ALL_WINNERS_FAILURE'; payload: string }
  | { type: 'CHANGE_DATE_FILTER'; payload: { date: string; filterType: DateFilter } }
  | { type: 'CHANGE_BET_TYPE_FILTER'; payload: string }
  | { type: 'REFRESH' }
  | { type: 'RESET' };
