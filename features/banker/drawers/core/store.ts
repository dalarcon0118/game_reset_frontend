import { createElmStore } from '@/shared/core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions, init } from './update';


export const useDrawersStore = createElmStore<Model, Msg>({
    initial: init,
    update,
    subscriptions
});

export const selectDrawersModel = (state: any) => state.model;
export const selectDrawersDispatch = (state: any) => state.dispatch;