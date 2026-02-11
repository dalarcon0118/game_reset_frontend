import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { initialModel } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Model } from './model';
import { Msg } from './msg';

export const useFiltersPluginStore = createElmStore<Model, Msg>(
  initialModel,
  update,
  effectHandlers as any,
  subscriptions
);

export const dispatch = (msg: Msg) => useFiltersPluginStore.getState().dispatch(msg);
