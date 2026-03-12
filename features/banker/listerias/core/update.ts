import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import {
    Cmd,
    Sub,
    SubDescriptor,
    RemoteDataHttp,
    RemoteData,
    singleton,
    ret,
    Return
} from '@core/tea-utils';
import { structureRepository, ChildStructure } from '@/shared/repositories/structure';
import { UpdateResult } from '@core/engine/engine';
import * as config from '@/config';

export const subscriptions = (_model: Model): SubDescriptor<Msg> => {
    return Sub.none();
};

const fetchDataCmd = (id: number): Cmd => {
    if (!id || id === 0) return Cmd.none;
    return RemoteDataHttp.fetch<ChildStructure[], Msg>(
        () => structureRepository.getChildren(id),
        (webData) => ({ type: 'DATA_RECEIVED', webData })
    );
};

export const init = (): UpdateResult<Model, Msg> => {
    const model: Model = {
        id: null,
        listerias: RemoteData.notAsked(),
    };
    return [model, Cmd.none];
};

export function update(model: Model, msg: Msg): UpdateResult<Model, Msg> {
    const result = match<Msg, Return<Model, Msg>>(msg)
        .with({ type: 'INIT_SCREEN' }, ({ id }) => {
            if (model.id === id && model.listerias.type !== 'NotAsked') {
                return singleton(model);
            }
            return ret(
                { ...model, id, listerias: RemoteData.loading() },
                fetchDataCmd(id)
            );
        })

        .with({ type: 'FETCH_DATA_REQUESTED' }, () => {
            if (!model.id) return singleton(model);
            return ret(
                { ...model, listerias: RemoteData.loading() },
                fetchDataCmd(model.id)
            );
        })

        .with({ type: 'DATA_RECEIVED' }, ({ webData }) => {
            return singleton({ ...model, listerias: webData });
        })

        .with({ type: 'REFRESH_CLICKED' }, () => {
            if (!model.id) return singleton(model);
            return ret(
                { ...model, listerias: RemoteData.loading() },
                fetchDataCmd(model.id)
            );
        })

        .with({ type: 'NAVIGATE_BACK' }, () => {
            return ret(model, Cmd.navigate({ pathname: '..', method: 'back' }));
        })

        .with({ type: 'LISTERIA_SELECTED' }, ({ listeriaId, name }) => {
            return ret(model, Cmd.navigate({
                pathname: config.routes.banker.drawer.screen,
                params: { id: listeriaId, title: name }
            }));
        })

        .with({ type: 'RULES_PRESSED' }, ({ listeriaId }) => {
            return ret(model, Cmd.navigate({
                pathname: config.routes.banker.rules.screen,
                params: { id_structure: listeriaId }
            }));
        })

        .exhaustive();

    return [result.model, result.cmd];
}
