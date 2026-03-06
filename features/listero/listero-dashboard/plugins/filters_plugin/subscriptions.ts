import { Model } from './model';
import { Sub } from '@/shared/core/tea-utils';
import { SYNC_STATUS_FILTER } from './msg';

export const subscriptions = (model: Model) => {
  if (!model.context?.hostStore) {
    return Sub.none();
  }

  return Sub.batch([
    Sub.watchStore(
      model.context.hostStore,
      (state: any) => {
        const hostModel = state.model || state;
        return hostModel[model.config.stateKey] ?? model.config.defaultValue;
      },
      (statusFilter) => SYNC_STATUS_FILTER(statusFilter),
      'filters-plugin-status-sync'
    )
  ]);
};
