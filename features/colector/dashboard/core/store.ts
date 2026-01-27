import { createElmStore } from '@/shared/core/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions } from './update';
import { RemoteData } from '@/shared/core/remote.data';
import { effectHandlers } from '@/shared/core/effect_handlers';

const initialModel: Model = {
    children: RemoteData.notAsked(),
    stats: RemoteData.notAsked(),
    currentDate: '', // Will be populated from backend
    userStructureId: null,
    showBalance: true,
    user: null,
};

const store = createElmStore<Model, Msg>(
    initialModel,
    update,
    effectHandlers as any,
    subscriptions
);

export const useDashboardStore = store;
export const selectDashboardModel = (state: any) => state.model;
export const selectDashboardDispatch = (state: any) => state.dispatch;
