import { createElmStore } from '@/shared/core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions, init } from './update';
import { effectHandlers } from '@/shared/core/tea-utils/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';

export const useDrawersStore = createElmStore<Model, Msg>(
    init,
    update,
    subscriptions,
);

export const selectDrawersModel = (state: any) => state.model;
export const selectDrawersDispatch = (state: any) => state.dispatch;