import { createElmStore } from '@/shared/core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions, init } from './update';

export const useListeriasStore = createElmStore<Model, Msg>({
    initial: init,
    update,
    subscriptions
});

export const selectListeriasModel = (state: { model: Model }) => state.model;
export const selectListeriasDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
