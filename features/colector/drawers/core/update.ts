import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { StructureService } from '@/shared/services/structure';
import { singleton, ret } from '@/shared/core/return';

const formatDateToString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const fetchDetailsCmd = (id: number, selectedDate: Date): Cmd => {
    if (!id || id === 0) return Cmd.none;
    return RemoteDataHttp.fetch(
        () => StructureService.getListeroDetails(id, formatDateToString(selectedDate)),
        (webData) => ({ type: 'DETAILS_RECEIVED', webData })
    );
};

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match<Msg, any>(msg)
        .with({ type: 'SET_SELECTED_DATE' }, ({ date }) => {
            const newDate = new Date(date);
            if (newDate > new Date()) return singleton(model);
            return ret(
                { ...model, selectedDate: newDate },
                fetchDetailsCmd(model.id, newDate)
            );
        })

        .with({ type: 'FETCH_DETAILS_REQUESTED' }, () =>
            ret(
                { ...model, details: RemoteData.loading() },
                fetchDetailsCmd(model.id, model.selectedDate)
            )
        )

        .with({ type: 'DETAILS_RECEIVED' }, ({ webData }) =>
            singleton({ ...model, details: webData })
        )

        .with({ type: 'REFRESH_CLICKED' }, () =>
            ret(model, fetchDetailsCmd(model.id, model.selectedDate))
        )

        .with({ type: 'NAVIGATE_BACK' }, () =>
            ret(model, Cmd.navigate({ pathname: '', method: 'back' }))
        )

        .with({ type: 'REPORT_CLICKED' }, ({ drawId }) =>
            ret(model, Cmd.navigate({
                pathname: '/colector/reports/form',
                params: { id: String(model.id), drawId: String(drawId) }
            }))
        )

        .with({ type: 'CONFIRM_DRAW' }, ({ drawId }) => {
            // For now, just log; full implementation would require task cmd for confirmation
            console.log('Confirm draw', drawId);
            return singleton(model);
        })

        .with({ type: 'NAVIGATE_DATE' }, ({ days }) => {
            const newDate = new Date(model.selectedDate);
            newDate.setDate(newDate.getDate() + days);
            if (newDate > new Date()) return singleton(model);
            return ret(
                { ...model, selectedDate: newDate },
                fetchDetailsCmd(model.id, newDate)
            );
        })

        .exhaustive();

    return [result.model, result.cmd];
};