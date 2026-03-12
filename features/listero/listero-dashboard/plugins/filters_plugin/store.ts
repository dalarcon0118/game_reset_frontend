import { createElmStore } from '@core/engine/engine';
import { initialModel } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Model } from './model';
import { Msg } from './msg';

export const useFiltersPluginStore = createElmStore<Model, Msg>({
  initial: (params: any) => [initialModel(params), null],
  update,
  subscriptions
});

export const dispatch = (msg: Msg) => useFiltersPluginStore.getState().dispatch(msg);
