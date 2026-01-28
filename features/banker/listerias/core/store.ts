import { createElmStore } from '@/shared/core/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions, init } from './update';
import { effectHandlers } from '@/shared/core/effect_handlers';

export const useListeriasStore = createElmStore<Model, Msg>(
    init,
    update,
    effectHandlers as any,
    subscriptions
);

export const selectListeriasModel = (state: any) => state.model;
export const selectListeriasDispatch = (state: any) => state.dispatch;
