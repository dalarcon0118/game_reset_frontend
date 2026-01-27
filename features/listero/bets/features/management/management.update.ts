import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { ManagementMsgType, ManagementMsg } from './management.types';
import { identifyBetTypes, selectListData, ListActions } from './management.utils';
import { Cmd } from '@/shared/core/cmd';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { BetService } from '@/shared/services/bet';
import { DrawService } from '@/shared/services/draw';

// --- Sub-handlers for better modularity ---

const handleInit = (model: GlobalModel, drawId: string, fetchExistingBets: boolean): Return<GlobalModel, ManagementMsg> => {
    const commands: any[] = [
        RemoteDataHttp.fetch(
            () => DrawService.getBetTypes(drawId),
            (response) => ({ type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE, response })
        ),
        RemoteDataHttp.fetch(
            () => DrawService.getOne(drawId).then(draw => {
                if (!draw) throw new Error('Draw not found');
                return draw;
            }),
            (response) => ({ type: ManagementMsgType.FETCH_DRAW_DETAILS_RESPONSE, response })
        )
    ];

    commands.push(fetchExistingBets ? ListActions.fetchBets(drawId) : ListActions.resetBets());
    return ret<GlobalModel, ManagementMsg>(
        {
            ...model,
            drawId,
            managementSession: {
                ...model.managementSession,
                saveStatus: RemoteData.notAsked(),
                saveSuccess: false
            }
        },
        commands
    );
};

const handleSaveResponse = (model: GlobalModel, response: any): Return<GlobalModel, ManagementMsg> => {
    return match(response)
        .with({ type: 'Success' }, ({ data }) => {
            const betId = Array.isArray(data) && data.length > 0 ? data[0].id : (data as any)?.id;
            return ret<GlobalModel, ManagementMsg>(
                {
                    ...model,
                    managementSession: { ...model.managementSession, saveStatus: response, saveSuccess: true },
                    listSession: {
                        ...model.listSession,
                        remoteData: RemoteData.success({ fijosCorridos: [], parlets: [], centenas: [], loteria: [] })
                    }
                },
                Cmd.navigate({
                    pathname: '/lister/bets/success',
                    params: { drawId: model.drawId, betId },
                    method: 'push'
                })
            );
        })
        .with({ type: 'Failure' }, ({ error }) => {
            const errorMessage = error?.message || error?.detail || 'Ocurrió un error al guardar las apuestas';
            return ret<GlobalModel, ManagementMsg>(
                { ...model, managementSession: { ...model.managementSession, saveStatus: response } },
                Cmd.alert({ title: 'Error al guardar', message: errorMessage })
            );
        })
        .otherwise(() => singleton(model));
};

// --- Main update function ---

export const updateManagement = (model: GlobalModel, msg: ManagementMsg): Return<GlobalModel, ManagementMsg> => {
    return match<ManagementMsg, Return<GlobalModel, ManagementMsg>>(msg)
        .with({ type: ManagementMsgType.INIT }, ({ drawId, fetchExistingBets = true }) =>
            handleInit(model, drawId, fetchExistingBets))

        .with({ type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED }, ({ drawId }) =>
            ret(model, RemoteDataHttp.fetch(
                () => DrawService.getBetTypes(drawId),
                (response) => ({ type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE, response })
            )))

        .with({ type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE }, ({ response }) =>
            match(response)
                .with({ type: 'Success' }, ({ data: betTypes }) => singleton({
                    ...model,
                    managementSession: { ...model.managementSession, betTypes: identifyBetTypes(betTypes) },
                } as GlobalModel))
                .with({ type: 'Failure' }, () => singleton({
                    ...model,
                    managementSession: { ...model.managementSession, saveStatus: response as any }
                } as GlobalModel))
                .otherwise(() => singleton(model)))

        .with({ type: ManagementMsgType.FETCH_DRAW_DETAILS_RESPONSE }, ({ response }) =>
            match(response)
                .with({ type: 'Success' }, () => singleton({
                    ...model,
                    managementSession: { ...model.managementSession, drawDetails: response }
                } as GlobalModel))
                .otherwise(() => singleton(model)))

        .with({ type: ManagementMsgType.SAVE_BETS_REQUESTED }, ({ drawId }) =>
            ret(
                {
                    ...model,
                    managementSession: {
                        ...model.managementSession,
                        saveStatus: RemoteData.loading()
                    }
                },
                RemoteDataHttp.fetch(
                    () => BetService.create({ drawId, ...selectListData(model) }),
                    (response) => ({ type: ManagementMsgType.SAVE_BETS_RESPONSE, response })
                )
            ))

        .with({ type: ManagementMsgType.SAVE_BETS_RESPONSE }, ({ response }) =>
            handleSaveResponse(model, response))

        .with({ type: ManagementMsgType.SHOW_SAVE_CONFIRMATION }, ({ drawId }) =>
            ret(model, Cmd.alert({
                title: 'Confirmar Guardado',
                message: 'Una vez guardadas las apuestas no podrán deshacerse. ¿Deseas continuar?',
                buttons: [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Guardar', onPressMsg: { type: ManagementMsgType.SAVE_BETS_REQUESTED, drawId } }
                ]
            })))

        .with({ type: ManagementMsgType.RESET_BETS }, () => singleton({
            ...model,
            managementSession: { ...model.managementSession, saveSuccess: false, saveStatus: RemoteData.notAsked() },
            listSession: {
                ...model.listSession,
                remoteData: RemoteData.success({ fijosCorridos: [], parlets: [], centenas: [], loteria: [] })
            }
        } as GlobalModel))

        .with({ type: ManagementMsgType.CLEAR_MANAGEMENT_ERROR }, () => singleton({
            ...model,
            managementSession: { ...model.managementSession, saveStatus: RemoteData.notAsked() },
        } as GlobalModel))

        .with({ type: ManagementMsgType.NAVIGATE_REQUESTED }, ({ onConfirm }) =>
            ret(model, Cmd.alert({
                title: 'Descartar cambios',
                message: 'Tienes apuestas en la lista sin guardar. ¿Estás seguro que deseas salir? Las apuestas se perderán.',
                buttons: [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Salir', style: 'destructive', onPressMsg: { type: ManagementMsgType.DISCARD_CHANGES_CONFIRMED, onConfirm } }
                ]
            })))

        .with({ type: ManagementMsgType.DISCARD_CHANGES_CONFIRMED }, ({ onConfirm }) =>
            ret(model, Cmd.task({
                task: async () => { onConfirm(); return { type: ManagementMsgType.NONE }; },
                onSuccess: (m) => m,
                onFailure: () => ({ type: ManagementMsgType.NONE })
            })))

        .with({ type: ManagementMsgType.SHARE_FAILED }, ({ error }) =>
            ret(model, Cmd.alert({ title: 'Error', message: error })))

        .with({ type: ManagementMsgType.NONE }, () => singleton(model))
        .exhaustive();
};
