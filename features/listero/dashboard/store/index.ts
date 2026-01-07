import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effectHandlers';
import { Model, Msg } from './types';
import { update, initialState } from './update';

export const useDashboardStore = createElmStore<Model, Msg>(
    initialState,
    update,
    effectHandlers as any
);

// Selectores
export const selectDraws = (state: { model: Model }) => state.model.draws;
export const selectSummary = (state: { model: Model }) => state.model.summary;
export const selectStatusFilter = (state: { model: Model }) => state.model.statusFilter;
export const selectDailyTotals = (state: { model: Model }) => state.model.dailyTotals;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
