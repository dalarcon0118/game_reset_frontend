import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import {
    Cmd,
    Sub,
    RemoteData,
    singleton,
    ret,
    Return
} from '@core/tea-utils';
import { Cmds } from './cmds';
import { StructureMapper } from '@/shared/repositories/structure/mappers/mappers';
import { StoreRegistry } from '@core/tea/store_registry';

import { SYSTEM_READY } from '@/config/signals';

/**
 * 🛰️ SUBSCRIPTIONS (Checkpoints)
 * Centraliza la orquestación de dependencias externas (SSoT).
 * Este es el "Gate" que asegura que el Dashboard solo actúe cuando el sistema esté listo.
 */
export const subscriptions = (model: Model) => {
    return Sub.batch([
        // Suscripción al bus de señales global (Sticky)
        // Esto elimina el acoplamiento con StoreRegistry y race conditions
        Sub.receiveMsg(SYSTEM_READY, (payload, dispatch) => {
            dispatch({
                type: 'SYSTEM_INITIALIZED',
                structureId: payload.structureId || null,
                isReady: true
            });
        }, 'banker-dashboard-system-ready-sticky')
    ]);
};

/**
 * 🧠 UPDATE (Lógica Pura)
 * Ahora es SRP: Solo maneja lógica de negocio del Dashboard.
 */
export const update = (model: Model, msg: Msg): [Model, any] => {
    return match<Msg, any>(msg)
        .with({ type: 'SYSTEM_INITIALIZED' }, ({ structureId, isReady }) => {
            // Actualizar estado del sistema en el modelo
            const nextModel = {
                ...model,
                isSystemReady: isReady,
                userStructureId: structureId
            };

            // Gate: Si no está listo o no hay usuario, reseteamos datos remotos
            if (!isReady || !structureId) {
                return singleton({
                    ...nextModel,
                    agencies: RemoteData.notAsked(),
                    summary: RemoteData.notAsked()
                });
            }

            // Evitar re-peticiones si ya estamos cargando o ya tenemos éxito
            const isAlreadyLoaded = model.agencies.type === 'Success' || model.agencies.type === 'Loading';
            if (isAlreadyLoaded) {
                return singleton(nextModel);
            }

            return ret(
                {
                    ...nextModel,
                    agencies: RemoteData.loading(),
                    summary: RemoteData.loading()
                },
                Cmds.fetchDashboardData(structureId)
            );
        })

        .with({ type: 'FETCH_DATA_REQUESTED' }, ({ structureId }) => {
            return ret(
                {
                    ...model,
                    agencies: RemoteData.loading(),
                    summary: RemoteData.loading()
                },
                Cmds.fetchDashboardData(structureId)
            );
        })

        .with({ type: 'AGENCIES_RECEIVED' }, ({ webData }) => {
            return singleton({
                ...model,
                agencies: webData
            });
        })

        .with({ type: 'SUMMARY_RECEIVED' }, ({ webData }) => {
            return singleton({
                ...model,
                summary: webData
            });
        })

        .with({ type: 'ERROR_OCCURRED' }, ({ error }) => {
            // Aquí podrías registrar el error o actualizar el modelo para mostrar un feedback visual
            return singleton({
                ...model,
                agencies: RemoteData.failure(error),
                summary: RemoteData.failure(error)
            });
        })

        .with({ type: 'REFRESH_CLICKED' }, () => {
            // Obtenemos el structureId actual del store de Auth para el refresh
            const authStore = StoreRegistry.get('AuthModuleV1') as any;
            const user = authStore?.getState()?.model?.user ?? authStore?.getState()?.user;
            const structureId = user?.structure?.id ? String(user.structure.id) : null;

            if (!structureId) return singleton(model);

            return ret(
                {
                    ...model,
                    agencies: RemoteData.loading(),
                    summary: RemoteData.loading()
                },
                Cmds.fetchDashboardData(structureId)
            );
        })

        .with({ type: 'AGENCY_SELECTED' }, ({ agencyId }) => {
            return ret(
                { ...model, selectedAgencyId: agencyId },
                Cmds.navigateToAgency(agencyId)
            );
        })

        .with({ type: 'RULES_PRESSED' }, ({ agencyId }) => {
            return ret(model, Cmds.navigateToRules(agencyId));
        })

        .with({ type: 'LIST_PRESSED' }, ({ agencyId }) => {
            return ret(model, Cmds.navigateToList(agencyId));
        })

        .with({ type: 'NAVIGATE_TO_SETTINGS' }, () => {
            return ret(model, Cmds.navigateToSettings());
        })

        .with({ type: 'NAVIGATE_TO_NOTIFICATIONS' }, () => {
            return ret(model, Cmds.navigateToNotifications());
        })

        .exhaustive();
};
