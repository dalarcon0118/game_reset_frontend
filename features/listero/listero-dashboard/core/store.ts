import { createElmStore } from '@/shared/core/engine/engine';
import { effectHandlers } from '@/shared/core/tea-utils';
import { initialState } from './initial.types';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Model } from './model';
import { Msg } from './msg';


export const useDashboardStore = createElmStore<Model, Msg>({
    initial: initialState,
    update,
    subscriptions
});

export const dispatch = (msg: Msg) => useDashboardStore.getState().dispatch(msg);
