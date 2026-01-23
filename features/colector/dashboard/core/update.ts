import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg, AUTH_USER_SYNCED } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { StructureService, ChildStructure } from '@/shared/services/Structure';
import { FinancialSummaryService } from '@/shared/services/FinancialSummary';
import { singleton, ret } from '@/shared/core/return';

import { useAuthStore } from '@/features/auth/store/store';

export const subscriptions = (model: Model) => {
    // Sincronización automática con el store de Auth
    const authSub = Sub.watchStore(
        useAuthStore,
        (state: any) => state.user,
        (user) => AUTH_USER_SYNCED(user),
        'colector-dashboard-auth-sync'
    );

    return Sub.batch([authSub]);
};

const fetchChildrenCmd = (structureId: string | null): Cmd => {
    if (!structureId) return Cmd.none;
    return RemoteDataHttp.fetch(
        () => StructureService.getChildren(Number(structureId)) as any,
        (webData) => ({ type: 'CHILDREN_RECEIVED', webData })
    );
};

const fetchStatsCmd = (structureId: string | null): Cmd => {
    if (!structureId) return Cmd.none;
    return RemoteDataHttp.fetch(
        () => FinancialSummaryService.getDashboardStats(structureId),
        (webData) => ({ type: 'STATS_RECEIVED', webData })
    );
};

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match<Msg, any>(msg)
        .with({ type: 'FETCH_CHILDREN_REQUESTED' }, ({ structureId }) => {
            const id = structureId || model.userStructureId;

            // Si ya tenemos datos exitosos para este ID, no volvemos a poner Loading
            if (model.children.type === 'Success' && model.userStructureId === id) {
                return singleton(model);
            }

            // Si ya estamos cargando para este mismo ID, también ignoramos.
            if (model.children.type === 'Loading' && model.userStructureId === id) {
                return singleton(model);
            }

            return ret(
                {
                    ...model,
                    userStructureId: id,
                    children: RemoteData.loading()
                },
                fetchChildrenCmd(id)
            );
        })

        .with({ type: 'CHILDREN_RECEIVED' }, ({ webData }) => {
            return singleton({ ...model, children: webData });
        })

        .with({ type: 'FETCH_STATS_REQUESTED' }, ({ structureId }) => {
            const id = structureId || model.userStructureId;

            if (model.stats.type === 'Success' && model.userStructureId === id) {
                return singleton(model);
            }

            if (model.stats.type === 'Loading' && model.userStructureId === id) {
                return singleton(model);
            }

            return ret(
                {
                    ...model,
                    userStructureId: id,
                    stats: RemoteData.loading()
                },
                fetchStatsCmd(id)
            );
        })

        .with({ type: 'STATS_RECEIVED' }, ({ webData }) => {
            if (webData.type === 'Success') {
                return singleton({
                    ...model,
                    stats: RemoteData.success(webData.data.stats),
                    currentDate: webData.data.date
                });
            }
            return singleton({ ...model, stats: webData });
        })

        .with({ type: 'REFRESH_CLICKED' }, () =>
            ret(model, Cmd.batch([fetchChildrenCmd(model.userStructureId), fetchStatsCmd(model.userStructureId)]))
        )

        .with({ type: 'AUTH_USER_SYNCED' }, ({ user }) => {
            const structure = user?.structure;
            const structureId = structure?.id?.toString() || null;

            let nextModel = { ...model };

            // Sincronizar ID de estructura si ha cambiado o si no hemos pedido datos aún
            const shouldFetch = (structureId && structureId !== model.userStructureId) ||
                (structureId && model.children.type === 'NotAsked');

            if (shouldFetch) {
                nextModel.userStructureId = structureId;
                nextModel.children = RemoteData.loading();
                nextModel.stats = RemoteData.loading();
                const cmd = Cmd.batch([fetchChildrenCmd(structureId), fetchStatsCmd(structureId)]);
                return ret(nextModel, cmd);
            }

            return singleton(nextModel);
        })

        .exhaustive();

    return [result.model, result.cmd];
};