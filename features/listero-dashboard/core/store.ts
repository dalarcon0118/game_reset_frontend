import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { initialState } from './initial.types';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Model } from './model';
import { Msg } from './msg';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';

export const useDashboardStore = createElmStore<Model, Msg>(
    initialState,
    update,
    effectHandlers as any,
    subscriptions,
    [createLoggerMiddleware()]
);

export const dispatch = (msg: Msg) => useDashboardStore.getState().dispatch(msg);
