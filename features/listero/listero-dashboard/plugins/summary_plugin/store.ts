import { createElmStore } from '@core/engine/engine';
import { effectHandlers } from '@core/tea-utils';
import { initialModel } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { createLoggerMiddleware } from '@core/middlewares/logger.middleware';
import { Model } from './model';
import { Msg } from './msg';


export const useSummaryPluginStore = createElmStore<Model, Msg>(
    {
        initial: initialModel,
        update,
        subscriptions
    }
);

export const dispatch = (msg: Msg) => useSummaryPluginStore.getState().dispatch(msg);
