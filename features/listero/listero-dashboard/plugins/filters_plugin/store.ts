import { createElmStore } from '@/shared/core/engine/engine';
import { effectHandlers } from '@/shared/core/tea-utils/effect_handlers';
import { initialModel } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { Model } from './model';
import { Msg } from './msg';

export const useFiltersPluginStore = createElmStore<Model, Msg>(
  (params) => [initialModel(params), null],
  update,
  effectHandlers as any,
  subscriptions,
  [createLoggerMiddleware()]
);

export const dispatch = (msg: Msg) => useFiltersPluginStore.getState().dispatch(msg);
