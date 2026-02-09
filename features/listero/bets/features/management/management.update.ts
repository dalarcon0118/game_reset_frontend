import { match } from 'ts-pattern';
import { Model as GlobalModel } from '@/features/listero/bets/core/model';
import { ManagementMsgType, ManagementMsg } from '@/features/listero/bets/features/management/management.types';
import { identifyBetTypes, selectListData, ListActions, generateReceiptCode } from '@/features/listero/bets/features/management/management.utils';
import { Cmd } from '@/shared/core/cmd';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData, WebData } from '@/shared/core/remote.data';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { BetService } from '@/shared/services/bet';
import { DrawService } from '@/shared/services/draw';
import { GameType, BetType } from '@/types';
import { buildCommandsForMode, validateViewMode, ViewMode } from '@/features/listero/bets/features/management/data-fetching.strategies';

// --- Sub-handlers for better modularity ---

const handleInit = (model: GlobalModel, drawId: string, fetchExistingBets: boolean, isEditing: boolean = false): Return<GlobalModel, ManagementMsg> => {
    // Convert isEditing boolean to view mode for Configuration Object Pattern
    const viewMode: ViewMode = isEditing ? 'annotation' : 'list';

    // Validate the view mode to ensure type safety
    validateViewMode(viewMode);

    // Build commands using the Configuration Object Pattern
    // This applies Single Responsibility Principle - data fetching logic is separated
    const commands = buildCommandsForMode(viewMode, drawId);

    return ret<GlobalModel, ManagementMsg>(
        {
            ...model,
            currentDrawId: drawId,
            managementSession: {
                ...model.managementSession,
                saveStatus: RemoteData.notAsked(),
                saveSuccess: false,
                fetchExistingBets: fetchExistingBets && !isEditing, // Don't fetch existing bets in annotation mode
                isEditing
            }
        },
        commands
    );
};

const handleSaveResponse = (model: GlobalModel, response: WebData<any>): Return<GlobalModel, ManagementMsg> => {
    return RemoteData.fold(
        {
            notAsked: () => singleton(model),
            loading: () => singleton({ ...model, managementSession: { ...model.managementSession, saveStatus: RemoteData.loading() } }),
            failure: (error) => ret({
                ...model,
                managementSession: {
                    ...model.managementSession,
                    saveStatus: RemoteData.failure(error),
                    saveSuccess: false
                }
            }, Cmd.alert({
                title: 'Error al Guardar',
                message: typeof error === 'string' ? error : 'No se pudieron guardar las apuestas. Por favor intente nuevamente.',
                buttons: [{ text: 'OK', style: 'cancel' }]
            })),
            success: (data) => ret(
                {
                    ...model,
                    managementSession: {
                        ...model.managementSession,
                        saveStatus: RemoteData.success(data),
                        saveSuccess: true
                    }
                },
                Cmd.batch([
                    ListActions.refreshBets(model.currentDrawId || ''),
                    Cmd.navigate({
                        pathname: '/lister/bet_success',
                        params: { drawId: model.currentDrawId || '' }
                    })
                ])
            )
        },
        response
    );
};

// --- Main update function ---

export const updateManagement = (model: GlobalModel, msg: ManagementMsg): Return<GlobalModel, ManagementMsg> => {
    return match<ManagementMsg, Return<GlobalModel, ManagementMsg>>(msg)
        .with({ type: ManagementMsgType.INIT }, ({ drawId, fetchExistingBets = true, isEditing = false }) =>
            handleInit(model, drawId, fetchExistingBets, isEditing))

        .with({ type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED }, ({ drawId }) =>
            ret(model, RemoteDataHttp.fetch(
                async () => {
                    const types = await DrawService.getBetTypes(drawId);
                    return types;
                },
                (response: WebData<GameType[]>) => ({ type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE, response })
            )))

        .with({ type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE }, ({ response }) =>
            match(response)
                .with({ type: 'Success' }, ({ data }) => singleton({
                    ...model,
                    managementSession: { ...model.managementSession, betTypes: identifyBetTypes(data) },
                }))
                .with({ type: 'Failure' }, ({ error }) => singleton({
                    ...model,
                    managementSession: { ...model.managementSession, saveStatus: RemoteData.failure(error) as WebData<BetType | BetType[]> }
                }))
                .otherwise(() => singleton(model)))

        .with({ type: ManagementMsgType.FETCH_DRAW_DETAILS_RESPONSE }, ({ response }) =>
            RemoteData.fold(
                {
                    notAsked: () => singleton(model),
                    loading: () => singleton(model),
                    failure: () => singleton(model),
                    success: () => singleton({
                        ...model,
                        managementSession: { ...model.managementSession, drawDetails: response }
                    })
                },
                response
            ))

        .with({ type: ManagementMsgType.SAVE_BETS_REQUESTED }, ({ drawId }) => {
            // Guard: Prevent double submission if already loading
            if (model.managementSession.saveStatus.type === 'Loading') {
                return singleton(model);
            }

            return ret(
                {
                    ...model,
                    managementSession: {
                        ...model.managementSession,
                        saveStatus: RemoteData.loading()
                    }
                },
                RemoteDataHttp.fetch(
                    async () => {
                        const receiptCode = generateReceiptCode();
                        const result = await BetService.create({ drawId, ...selectListData(model), receiptCode });
                        return result as any;
                    },
                    (response: WebData<any>) => ({ type: ManagementMsgType.SAVE_BETS_RESPONSE, response })
                )
            );
        })

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
        }))

        .with({ type: ManagementMsgType.CLEAR_MANAGEMENT_ERROR }, () => singleton({
            ...model,
            managementSession: { ...model.managementSession, saveStatus: RemoteData.notAsked() },
        }))

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
