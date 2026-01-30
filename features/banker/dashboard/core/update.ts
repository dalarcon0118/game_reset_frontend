import { match } from 'ts-pattern';
import { Model, DashboardSummary } from './model';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { BankerDashboardService } from '../../services/banker_dashboard_service';
import { singleton, ret } from '@/shared/core/return';
import { useAuthStore } from '@/features/auth/store/store';
import * as config from '@/config';

export const subscriptions = (model: Model) => {
    // Sincronización automática con el store de Auth
    const authSub = Sub.watchStore(
        useAuthStore,
        (state: any) => state?.model?.user ?? state?.user,
        (user) => ({ type: 'AUTH_USER_SYNCED', user }),
        'banker-dashboard-auth-sync'
    );

    return Sub.batch([authSub]);
};

const fetchDataCmd = (structureId: string | null): Cmd => {
    if (!structureId) return Cmd.none;
    return RemoteDataHttp.fetch(
        () => BankerDashboardService.getDashboardData(Number(structureId)),
        (webData) => ({ type: 'DATA_RECEIVED', webData })
    );
};

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match<Msg, any>(msg)
        .with({ type: 'FETCH_DATA_REQUESTED' }, ({ structureId }) => {
            // Si ya tenemos datos exitosos para este ID, no volvemos a poner Loading
            if (model.agencies.type === 'Success' && model.userStructureId === structureId) {
                return singleton(model);
            }

            // Si ya estamos cargando para este mismo ID, también ignoramos.
            if (model.agencies.type === 'Loading' && model.userStructureId === structureId) {
                return singleton(model);
            }

            return ret(
                {
                    ...model,
                    userStructureId: structureId,
                    agencies: RemoteData.loading(),
                    summary: RemoteData.loading()
                },
                fetchDataCmd(structureId)
            );
        })

        .with({ type: 'DATA_RECEIVED' }, ({ webData }) => {
            if (webData.type === 'Success') {
                return singleton({
                    ...model,
                    agencies: RemoteData.success(webData.data.children),
                    summary: RemoteData.success(webData.data.summary)
                });
            }
            return singleton({
                ...model,
                agencies: webData,
                summary: webData
            });
        })

        .with({ type: 'REFRESH_CLICKED' }, () => {
            return ret(
                {
                    ...model,
                    agencies: RemoteData.loading(),
                    summary: RemoteData.loading()
                },
                fetchDataCmd(model.userStructureId)
            );
        })

        .with({ type: 'AGENCY_SELECTED' }, ({ agencyId }) => {
            // Protección extra contra navegación redundante en el update
            if (model.agencies.type !== 'Success') return singleton(model);

            return ret(
                { ...model, selectedAgencyId: agencyId },
                Cmd.navigate({
                    pathname: config.routes.banker.drawer.screen,
                    params: { id: agencyId }
                })
            );
        })

        .with({ type: 'RULES_PRESSED' }, ({ agencyId }) => {
            return ret(model, Cmd.navigate({
                pathname: config.routes.banker.rules.screen,
                params: { id_structure: agencyId }
            }));
        })

        .with({ type: 'LIST_PRESSED' }, ({ agencyId }) => {
            return ret(model, Cmd.navigate({
                pathname: config.routes.banker.listerias.screen,
                params: { id: agencyId }
            }));
        })

        .with({ type: 'AUTH_USER_SYNCED' }, ({ user }) => {
            const structureId = user?.structure?.id ? String(user.structure.id) : model.userStructureId;
            return ret(
                { ...model, userStructureId: structureId },
                structureId !== model.userStructureId ? fetchDataCmd(structureId) : Cmd.none
            );
        })

        .with({ type: 'NAVIGATE_TO_SETTINGS' }, () => {
            return ret(model, Cmd.navigate(config.routes.banker.settings.screen));
        })

        .with({ type: 'NAVIGATE_TO_NOTIFICATIONS' }, () => {
            return ret(model, Cmd.navigate('/notifications'));
        })

        .exhaustive();

    return [result.model, result.cmd];
};