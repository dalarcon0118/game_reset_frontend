import { createElmStore } from '@/shared/core/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions } from './update';
import { RemoteData } from '@/shared/core/remote.data';
import { effectHandlers } from '@/shared/core/effectHandlers';

const initialModel: Model = {
    children: RemoteData.notAsked(),
    userStructureId: null,
};

const store = createElmStore<Model, Msg>(
    initialModel,
    update,
    effectHandlers,
    subscriptions
);

export const useDashboardStore = store;
export const selectDashboardModel = (state: any) => state.model;
export const selectDashboardDispatch = (state: any) => state.dispatch;