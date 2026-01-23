import { createElmStore } from '@/shared/core/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update } from './update';
import { RemoteData } from '@/shared/core/remote.data';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { StructureService } from '@/shared/services/Structure';
import { Cmd } from '@/shared/core/cmd';
import { effectHandlers } from '@/shared/core/effectHandlers';

const createInitialModel = (id: number): Model => ({
    id,
    selectedDate: new Date(),
    details: RemoteData.notAsked(),
});

const formatDateToString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const fetchDetailsCmd = (id: number, selectedDate: Date): Cmd => {
    if (!id) return null;
    return RemoteDataHttp.fetch(
        () => StructureService.getListeroDetails(id, formatDateToString(selectedDate)),
        (webData) => ({ type: 'DETAILS_RECEIVED', webData })
    );
};

const initial = (params?: { id: number }) => {
    const id = params?.id || 0;
    const model = createInitialModel(id);
    return [model, id ? fetchDetailsCmd(id, model.selectedDate) : null] as [Model, Cmd];
};

const store = createElmStore<Model, Msg>(
    initial,
    update,
    effectHandlers as any
);

export const useDrawersStore = store;
export const selectDrawersModel = (state: { model: Model; dispatch: (msg: Msg) => void; init: (params?: any) => void }) => state.model;
export const selectDrawersDispatch = (state: { model: Model; dispatch: (msg: Msg) => void; init: (params?: any) => void }) => state.dispatch;