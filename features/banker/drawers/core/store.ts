import { createElmStore } from '@core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions, init } from './update';


export const useDrawersStore = createElmStore<Model, Msg>({
    initial: init,
    update,
    subscriptions
});

export const selectDrawersModel = (state: { model: Model }) => state.model;
export const selectDrawersDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;