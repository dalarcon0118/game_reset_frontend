import { createElmStore } from '../../../../shared/core/engine';
import { effectHandlers } from '../../../../shared/core/effectHandlers';
import { Model, initialModel } from './types/core.types';
import { Msg } from './types/index';
import { update } from './updates/index';

export const useBetsStore = createElmStore<Model, Msg>(
    initialModel,
    update,
    effectHandlers as any
);

// Selectores
export const selectBetsModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
