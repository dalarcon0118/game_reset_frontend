import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { Sub, SubDescriptor } from '@/shared/core/sub';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { StructureService, ChildStructure } from '@/shared/services/structure';
import { useDashboardStore } from '../../dashboard/core/store';
import { singleton, ret, Return } from '@/shared/core/return';
import { UpdateResult } from '@/shared/core/engine';
import * as config from '@/config';

export const subscriptions = (_model: Model): SubDescriptor<Msg> => {
    return Sub.watchStore(
        useDashboardStore,
        (state: any) => state?.model?.selectedAgencyId ?? state?.selectedAgencyId,
        (id) => ({ type: 'INIT_SCREEN', id: id || 0 }),
        'listerias-init-sync'
    );
};

const fetchDataCmd = (id: number): Cmd => {
    if (!id || id === 0) return Cmd.none;
    return RemoteDataHttp.fetch<ChildStructure[], Msg>(
        () => StructureService.getChildren(id) as Promise<ChildStructure[]>,
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
            return ret(model, Cmd.back());
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
