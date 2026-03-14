import { match } from 'ts-pattern';
import { Model, DashboardStats } from './model';
import { Msg, AUTH_USER_SYNCED } from './msg';
import {
    Cmd,
    Sub,
    RemoteDataHttp,
    RemoteData,
    singleton,
    ret
} from '@core/tea-utils';
import { structureRepository, ChildStructure } from '@/shared/repositories/structure';
import { financialRepository, FinancialKeys } from '@/shared/repositories/financial/ledger.repository';
import { TimerRepository } from '@/shared/repositories/system/time';

import { AuthModuleV1 } from '@/features/auth/v1/adapters/auth_provider';

export const subscriptions = (model: Model) => {
    // Sincronización automática con el store de Auth
    const authSub = Sub.watchStore(
        'AuthModuleV1',
        (state: any) => state?.model?.user ?? state?.user,
        (user) => AUTH_USER_SYNCED(user),
        'colector-dashboard-auth-sync'
    );

    return Sub.batch([authSub]);
};

const fetchChildrenCmd = (structureId: string | null): Cmd => {
    if (!structureId || structureId === '0') return Cmd.none;
    return RemoteDataHttp.fetch(
        () => structureRepository.getChildren(Number(structureId)),
        (webData) => ({ type: 'CHILDREN_RECEIVED', webData })
    );
};

const fetchStatsCmd = (structureId: string | null): Cmd => {
    if (!structureId || structureId === '0') return Cmd.none;
    return RemoteDataHttp.fetch(
        async () => {
            const trustedNow = TimerRepository.getTrustedNow(Date.now());
            const filter = FinancialKeys.forStructure(structureId);
            const aggregation = await financialRepository.getAggregation(trustedNow, filter);
            const commissions = aggregation.credits * 0.10; // 10% hardcoded for now or from config
            const stats: DashboardStats = {
                total: aggregation.count,
                pending: 0, // Ledger doesn't track pending yet
                completed: aggregation.count,
                netTotal: String(aggregation.total - commissions),
                grossTotal: String(aggregation.credits),
                commissions: String(commissions),
                dailyProfit: String(aggregation.total - commissions)
            };
            return {
                stats,
                date: new Date().toISOString().split('T')[0]
            };
        },
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

        .with({ type: 'AUTH_USER_SYNCED' }, ({ user }) => {
            if (!user) {
                return singleton({
                    ...model,
                    user: null,
                    userStructureId: null,
                    children: RemoteData.notAsked(),
                    stats: RemoteData.notAsked()
                });
            }
            const structureId = user.structure?.id ? String(user.structure.id) : model.userStructureId;
            return ret(
                { ...model, user, userStructureId: structureId },
                structureId !== model.userStructureId ? Cmd.batch([
                    fetchChildrenCmd(structureId),
                    fetchStatsCmd(structureId)
                ]) : Cmd.none
            );
        })

        .with({ type: 'REFRESH_CLICKED' }, () => {
            return ret(
                {
                    ...model,
                    children: RemoteData.loading(),
                    stats: RemoteData.loading()
                },
                Cmd.batch([
                    fetchChildrenCmd(model.userStructureId),
                    fetchStatsCmd(model.userStructureId)
                ])
            );
        })

        .with({ type: 'TOGGLE_BALANCE' }, () => {
            return singleton({ ...model, showBalance: !model.showBalance });
        })

        .with({ type: 'NAVIGATE_TO_NOTIFICATIONS' }, () => {
            return ret(model, Cmd.navigate('/notifications'));
        })

        .with({ type: 'NAVIGATE_TO_DETAILS' }, ({ id, name }) => {
            return ret(model, Cmd.navigate({
                pathname: '/colector/details/[id]',
                params: { id, title: name }
            }));
        })

        .with({ type: 'NAVIGATE_TO_RULES' }, ({ structureId }) => {
            return ret(model, Cmd.navigate({
                pathname: '/colector/rules',
                params: { id_structure: structureId }
            }));
        })

        .with({ type: 'NAVIGATE_TO_SETTINGS' }, () => {
            return ret(model, Cmd.navigate('/colector/settings'));
        })

        .exhaustive();

    return [result.model, result.cmd];
};