import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effectHandlers';
import { initialState } from './initial.types';
import { update, subscriptions } from './update';
import { Model } from './model';
import { Msg } from './msg';

export const useDashboardStore = createElmStore<Model, Msg>(
    initialState,
    update,
    effectHandlers as any,
    subscriptions
);

export const dispatch = (msg: Msg) => useDashboardStore.getState().dispatch(msg);
