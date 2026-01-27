import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { Model } from './model';
import { Msg } from './msg';
import { update, init } from './update';

export const useBetsStore = createElmStore<Model, Msg>(
    init,
    update,
    effectHandlers as any
);

// Selectores
export const selectBetsModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
export const selectInit = (state: { init: (params?: any) => void }) => state.init;
