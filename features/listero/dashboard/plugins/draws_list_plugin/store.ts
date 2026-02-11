import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { initialModel, Model } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Msg } from './msg';

export const useDrawsListPluginStore = createElmStore<Model, Msg>(
  initialModel,
  update,
  effectHandlers as any,
  subscriptions
);

export const dispatch = (msg: Msg) => useDrawsListPluginStore.getState().dispatch(msg);
