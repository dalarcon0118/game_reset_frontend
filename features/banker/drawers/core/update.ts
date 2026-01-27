import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { Sub, SubDescriptor } from '@/shared/core/sub';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { StructureService } from '@/shared/services/Structure';
import { useDashboardStore } from '../../dashboard/core/store';
import { singleton, ret, Return } from '@/shared/core/return';
import { UpdateResult } from '@/shared/core/engine';
import * as config from '@/config';

export const subscriptions = (_model: Model): SubDescriptor<Msg> => {
    return Sub.watchStore(
        useDashboardStore,
        (state: any) => state.model.selectedAgencyId,
        (id) => ({ type: 'INIT_SCREEN', id: id || 0 }),
        'drawers-init-sync'
    );
};

const fetchDetailsCmd = (id: number, date: Date): Cmd => {
    const dateStr = date.toISOString().split('T')[0];
    return RemoteDataHttp.fetch(
        () => StructureService.getListeroDetails(id, dateStr),
        (webData) => ({ type: 'DETAILS_RECEIVED', webData })
    );
};

export const init = (): UpdateResult<Model, Msg> => {
    const model: Model = {
        id: null,
        selectedDate: new Date(),
        details: RemoteData.notAsked(),
    };
    return [model, Cmd.none];
};

export function update(model: Model, msg: Msg): UpdateResult<Model, Msg> {
    const result = match<Msg, Return<Model, Msg>>(msg)
        .with({ type: 'INIT_SCREEN' }, ({ id }) => {
            if (model.id === id && model.details.type !== 'NotAsked') {
                return singleton(model);
            }
            return ret(
                { ...model, id, details: RemoteData.loading() },
                fetchDetailsCmd(id, model.selectedDate)
            );
        })

        .with({ type: 'SET_SELECTED_DATE' }, ({ date }) => {
            if (!model.id) return singleton({ ...model, selectedDate: date });
            return ret(
                { ...model, selectedDate: date, details: RemoteData.loading() },
                fetchDetailsCmd(model.id, date)
            );
        })

        .with({ type: 'FETCH_DETAILS_REQUESTED' }, () => {
            if (!model.id) return singleton(model);
            return ret(
                { ...model, details: RemoteData.loading() },
                fetchDetailsCmd(model.id, model.selectedDate)
            );
        })

        .with({ type: 'DETAILS_RECEIVED' }, ({ webData }) => {
            return singleton({ ...model, details: webData });
        })

        .with({ type: 'REFRESH_CLICKED' }, () => {
            if (!model.id) return singleton(model);
            return ret(
                { ...model, details: RemoteData.loading() },
                fetchDetailsCmd(model.id, model.selectedDate)
            );
        })

        .with({ type: 'NAVIGATE_BACK' }, () => {
            return ret(model, Cmd.navigate({ pathname: '', method: 'back' }));
        })

        .with({ type: 'REPORT_CLICKED' }, ({ drawId }) => {
            return ret(model, Cmd.navigate({
                pathname: config.routes.banker.reports_form.screen,
                params: { id: String(drawId) }
            }));
        })

        .with({ type: 'CONFIRM_DRAW' }, () => {
            return singleton(model);
        })

        .with({ type: 'NAVIGATE_DATE' }, ({ days }) => {
            const newDate = new Date(model.selectedDate);
            newDate.setDate(newDate.getDate() + days);
            if (newDate > new Date()) return singleton(model);

            if (!model.id) return singleton({ ...model, selectedDate: newDate });

            return ret(
                { ...model, selectedDate: newDate, details: RemoteData.loading() },
                fetchDetailsCmd(model.id, newDate)
            );
        })

        .exhaustive();

    return [result.model, result.cmd];
}