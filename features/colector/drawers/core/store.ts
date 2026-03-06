import { createElmStore } from '@/shared/core/engine/engine';
import { Model } from './model';
import { Msg } from './msg';
import { update } from './update';
import { RemoteData, RemoteDataHttp, Cmd } from '@/shared/core/tea-utils';
import { structureRepository } from '@/shared/repositories/structure';


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
        () => structureRepository.getListeroDetails(id, formatDateToString(selectedDate)),
        (webData) => ({ type: 'DETAILS_RECEIVED', webData })
    );
};

const initial = (params?: { id: number }) => {
    const id = params?.id || 0;
    const model = createInitialModel(id);
    return [model, id ? fetchDetailsCmd(id, model.selectedDate) : null] as [Model, Cmd];
};

const store = createElmStore<Model, Msg>({
    initial,
    update
});

export const useDrawersStore = store;
export const selectDrawersModel = (state: { model: Model; dispatch: (msg: Msg) => void; init: (params?: any) => void }) => state.model;
export const selectDrawersDispatch = (state: { model: Model; dispatch: (msg: Msg) => void; init: (params?: any) => void }) => state.dispatch;