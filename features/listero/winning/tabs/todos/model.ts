import { TodosModel } from './types';
import { RemoteData } from '@core/tea-utils';

export const initialTodosModel: TodosModel = {
  allWinners: RemoteData.notAsked(),
  selectedDate: new Date().toISOString().split('T')[0],
  dateFilterType: 'all',
  structureId: null,
  configuredBetTypes: [],
  betTypeFilter: 'all',
  filteredData: [],
};
