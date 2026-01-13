import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effectHandlers';
import { Model } from './model';
import { initialModel } from './initial.types';
import { Msg } from './msg';
import { update } from './update';

export const useBetsStore = createElmStore<Model, Msg>(
    initialModel,
    update,
    effectHandlers as any
);

// Selectores
export const selectBetsModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
