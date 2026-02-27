import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { initialModel } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { Model } from './model';
import { Msg } from './msg';


export const useSummaryPluginStore = createElmStore<Model, Msg>(
    initialModel,
    update,
    effectHandlers as any,
    subscriptions,
    [createLoggerMiddleware()]
);

export const dispatch = (msg: Msg) => useSummaryPluginStore.getState().dispatch(msg);