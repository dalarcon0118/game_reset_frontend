import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import {
    Cmd,
    Sub,
    SubDescriptor,
    RemoteData,
    singleton,
    ret,
    Return
} from '@core/tea-utils';
import { Cmds } from './cmds';
import { TimePolicy } from '@/shared/repositories/system/time/time.update';

export const subscriptions = (_model: Model): SubDescriptor<Msg> => {
    return Sub.none();
};

const triggerFetch = (model: Model, id: number | null, date: Date): Return<Model, Msg> => {
    if (id === null) return singleton({ ...model, selectedDate: date });

    // Evitar disparar carga si ya estamos cargando los mismos datos
    const isSameDate = TimePolicy.formatLocalDate(model.selectedDate) === TimePolicy.formatLocalDate(date);
    if (model.id === id && isSameDate && model.details.type === 'Loading') {
        return singleton(model);
    }

    return ret(
        { ...model, id, selectedDate: date, details: RemoteData.loading() },
        Cmds.fetchListeroDetails(id, date)
    );
};

export const init = (params?: { id: number }): [Model, Cmd] => {
    const model: Model = {
        id: params?.id || null,
        selectedDate: new Date(),
        details: RemoteData.notAsked(),
        filters: {
            status: null,
            drawType: null,
        },
    };

    if (model.id) {
        const { model: nextModel, cmd } = triggerFetch(model, model.id, model.selectedDate);
        return [nextModel, cmd];
    }

    return [model, Cmd.none];
};

export function update(model: Model, msg: Msg): [Model, Cmd] {
    const result = match<Msg, Return<Model, Msg>>(msg)
        .with({ type: 'INIT_SCREEN' }, ({ id }) => {
            // Guardia de idempotencia: solo cargar si el ID cambia o no hay datos
            if (model.id === id && model.details.type !== 'NotAsked') {
                return singleton(model);
            }
            return triggerFetch(model, id, model.selectedDate);
        })

        .with({ type: 'SET_SELECTED_DATE' }, ({ date }) => {
            const isSameDate = model.selectedDate.getTime() === date.getTime();
            if (isSameDate && model.details.type !== 'NotAsked') {
                return singleton(model);
            }
            return triggerFetch(model, model.id, date);
        })

        .with({ type: 'FETCH_DETAILS_REQUESTED' }, () => {
            // Solo disparar si no hay una carga en curso
            if (model.details.type === 'Loading') {
                return singleton(model);
            }
            return triggerFetch(model, model.id, model.selectedDate);
        })

        .with({ type: 'DETAILS_RECEIVED' }, ({ webData }) =>
            singleton({ ...model, details: webData })
        )

        .with({ type: 'REFRESH_CLICKED' }, () =>
            triggerFetch(model, model.id, model.selectedDate)
        )

        .with({ type: 'NAVIGATE_BACK' }, () =>
            ret(model, Cmds.navigateBack())
        )

        .with({ type: 'REPORT_CLICKED' }, ({ drawId }) =>
            ret(model, Cmds.navigateToReport(drawId))
        )

        .with({ type: 'CONFIRM_DRAW' }, ({ drawId }) =>
            ret(model, Cmds.confirmDraw(drawId))
        )

        .with({ type: 'NAVIGATE_DATE' }, ({ days }) =>
            ret(model, Cmds.navigateDate(model.selectedDate, days))
        )

        .with({ type: 'SET_STATUS_FILTER' }, ({ status }) =>
            singleton({
                ...model,
                filters: { ...model.filters, status }
            })
        )

        .with({ type: 'SET_TYPE_FILTER' }, ({ drawType }) =>
            singleton({
                ...model,
                filters: { ...model.filters, drawType }
            })
        )

        .with({ type: 'CLEAR_FILTERS' }, () =>
            singleton({
                ...model,
                filters: { status: null, drawType: null }
            })
        )

        .exhaustive();

    return [result.model, result.cmd];
}