import { createElmStore } from '@/shared/core/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions, init } from './update';
import { effectHandlers } from '@/shared/core/effectHandlers';

export const useDrawersStore = createElmStore<Model, Msg>(
    init,
    update,
    effectHandlers as any,
    subscriptions
);

export const selectDrawersModel = (state: any) => state.model;
export const selectDrawersDispatch = (state: any) => state.dispatch;