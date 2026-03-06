import { createElmStore } from '@/shared/core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions, init } from './update';
import { effectHandlers } from '@/shared/core/tea-utils/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';


export const useListeriasStore = createElmStore<Model, Msg>(
    init,
    update,
    effectHandlers as any,
    subscriptions,
    [createLoggerMiddleware()]
);

export const selectListeriasModel = (state: any) => state.model;
export const selectListeriasDispatch = (state: any) => state.dispatch;
