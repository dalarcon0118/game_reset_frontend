import { singleton, ret, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { Model, initialSummary, BetSummary } from './model';
import { Msg, CoreMsg, CoreMsgType } from './msg';
import { match } from 'ts-pattern';
import { RemoteData } from '@/shared/core/remote.data';
import { updateParlet } from '../features/parlet/parlet.update';
import { updateFijos } from '../features/fijos-corridos/fijos.update';
import { updateCentena } from '../features/centena/centena.update';
import { updateLoteria } from '@/features/listero/games/loteria/loteria.update';
import { updateManagement } from '../features/management/management.update';
import { updateKeyboard } from '../features/keyboard/keyboard.update';
import { updateList } from '../features/bet-list/list.update';
import { updateCreate } from '../features/create-bet/create.update';
import { updateEdit } from '../features/edit-bet/edit.update';
import { updateRules } from '../features/rules/rules.update';
import { updateRewardsRules } from '../features/rewards-rules/rewards.update';
import { updateUi } from '../features/bet-ui/ui.update';
import { updateSuccess } from '../features/success/success.update';

// Initial states from features
import { initialParletState } from '../features/parlet/parlet.types';
import { initialCentenaState } from '../features/centena/centena.types';
import { initialLoteriaState } from '@/features/listero/games/loteria/loteria.types';
import { initialManagementState } from '../features/management/management.types';
import { initialEditState } from '../features/edit-bet/edit.types';
import { initialCreateState } from '../features/create-bet/create.types';
import { ListMsgType, initialListState } from '../features/bet-list/list.types';
import { initialSuccessState } from '../features/success/success.types';
import { createRewardsCache, createRulesCache } from '../features/rewards-rules/rewards.types';
import { initialRulesState } from '../features/rules/rules.types';

/**
 * Helper to calculate the summary of bets.
 * Uses entrySession when isEditing is true, otherwise uses listSession.remoteData
 */
const calculateSummary = (model: Model): BetSummary => {
    const isSaving = model.managementSession.saveStatus.type === 'Loading';

    // Usar entrySession cuando estamos en modo edición, de lo contrario usar listSession
    const dataSource = model.isEditing ? model.entrySession :
        (model.listSession.remoteData.type === 'Success' ? model.listSession.remoteData.data : null);

    if (!dataSource) {
        return {
            ...initialSummary,
            isSaving
        };
    }

    const { fijosCorridos, parlets, centenas, loteria } = dataSource;

    const loteriaTotal = loteria.reduce((total, bet) => total + (bet.amount || 0), 0);

    const fijosCorridosTotal = fijosCorridos.reduce((total, bet) => {
        const fijoAmount = bet.fijoAmount || 0;
        const corridoAmount = bet.corridoAmount || 0;
        return total + fijoAmount + corridoAmount;
    }, 0);

    const parletsTotal = parlets.reduce((total, parlet) => {
        if (parlet.bets && parlet.bets.length > 0 && parlet.amount) {
            const numBets = parlet.bets.length;
            const parletTotal = numBets * (numBets - 1) * parlet.amount;
            return total + parletTotal;
        }
        return total;
    }, 0);

    const centenasTotal = centenas.reduce((total, centena) => total + (centena.amount || 0), 0);

    const grandTotal = loteriaTotal + fijosCorridosTotal + parletsTotal + centenasTotal;
    const count = loteria.length + fijosCorridos.length + parlets.length + centenas.length;
    const hasBets = count > 0;

    return {
        loteriaTotal,
        fijosCorridosTotal,
        parletsTotal,
        centenasTotal,
        grandTotal,
        hasBets,
        isSaving,
        count
    };
};

/**
 * Helper to wrap feature update calls and update summary.
 */
function wrapUpdate<SubMsg>(
    msgWrapper: (subMsg: SubMsg) => Msg,
    subReturn: Return<Model, SubMsg>
): Return<Model, Msg> {
    const updatedModel = {
        ...subReturn.model,
        summary: calculateSummary(subReturn.model)
    };

    return Return.singleton((_: any) => updatedModel).andMapCmd(
        msgWrapper,
        subReturn
    );
}

export function update(model: Model, msg: Msg): Return<Model, Msg> {
    return match<Msg, Return<Model, Msg>>(msg)
        .with({ type: 'CORE' }, ({ payload }) => handleCoreMessage(payload, model))

        .with({ type: 'MANAGEMENT' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'MANAGEMENT', payload: subMsg }),
                updateManagement(model, payload)
            )
        )

        .with({ type: 'KEYBOARD' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'KEYBOARD', payload: subMsg }),
                updateKeyboard(model, payload)
            )
        )

        .with({ type: 'PARLET' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'PARLET', payload: subMsg }),
                updateParlet(model, payload as any)
            )
        )

        .with({ type: 'FIJOS' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'FIJOS', payload: subMsg }),
                updateFijos(model, payload as any)
            )
        )

        .with({ type: 'CENTENA' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'CENTENA', payload: subMsg }),
                updateCentena(model, payload as any)
            )
        )

        .with({ type: 'LOTERIA' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'LOTERIA', payload: subMsg }),
                updateLoteria(model, payload as any)
            )
        )

        .with({ type: 'LIST' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'LIST', payload: subMsg }),
                updateList(model, payload as any)
            )
        )

        .with({ type: 'CREATE' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'CREATE', payload: subMsg }),
                updateCreate(model, payload as any)
            )
        )

        .with({ type: 'EDIT' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'EDIT', payload: subMsg }),
                updateEdit(model, payload as any)
            )
        )

        .with({ type: 'RULES' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'RULES', payload: subMsg }),
                updateRules(model, payload as any)
            )
        )

        .with({ type: 'REWARDS_RULES' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'REWARDS_RULES', payload: subMsg }),
                updateRewardsRules(model, payload as any)
            )
        )

        .with({ type: 'UI' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'UI', payload: subMsg }),
                updateUi(model, payload as any)
            )
        )

        .with({ type: 'SUCCESS' }, ({ payload }) =>
            wrapUpdate(
                (subMsg) => ({ type: 'SUCCESS', payload: subMsg }),
                updateSuccess(model, payload)
            )
        )

        .otherwise(() => {
            console.warn('Unhandled message type:', msg);
            return singleton(model);
        });
}

function handleCoreMessage(msg: CoreMsg, model: Model): Return<Model, Msg> {
    return match<CoreMsg, Return<Model, Msg>>(msg)
        .with({ type: CoreMsgType.DRAW_INFO_REQUESTED }, ({ drawId }) => {
            return ret(
                model,
                Cmd.http(
                    { url: `/draw/draws/${drawId}/` },
                    (res: any) => ({
                        type: 'CORE',
                        payload: {
                            type: CoreMsgType.DRAW_INFO_RECEIVED,
                            webData: RemoteData.success(res)
                        }
                    }),
                    (error: any) => ({
                        type: 'CORE',
                        payload: {
                            type: CoreMsgType.DRAW_INFO_RECEIVED,
                            webData: RemoteData.failure(error?.message || 'Error al obtener información del sorteo')
                        }
                    })
                )
            );
        })

        .with({ type: CoreMsgType.DRAW_INFO_RECEIVED }, ({ webData }) => {
            return singleton({
                ...model,
                drawTypeCode: RemoteData.map(data => data?.draw_type_details?.code || '', webData),
                managementSession: { ...model.managementSession, drawDetails: webData }
            });
        })

        .with({ type: CoreMsgType.SCREEN_FOCUSED }, (m) => {
            const { drawId, isEditing } = m;

            // Si ya tenemos el tipo de sorteo para este ID, no lo ponemos en Loading para evitar parpadeos/bloqueos
            const alreadyHasDrawInfo = model.drawTypeCode.type === 'Success' && model.currentDrawId === drawId;

            const nextModel: Model = {
                ...model,
                currentDrawId: drawId,
                isEditing,
                drawTypeCode: alreadyHasDrawInfo ? model.drawTypeCode : RemoteData.loading<any, string>()
            };

            return ret(
                nextModel,
                Cmd.batch([
                    Cmd.ofMsg({
                        type: 'CORE',
                        payload: { type: CoreMsgType.DRAW_INFO_REQUESTED, drawId }
                    }),
                    // Siempre cargar la lista del backend (listSession) independientemente de si estamos anotando
                    Cmd.ofMsg({
                        type: 'LIST',
                        payload: { type: ListMsgType.FETCH_BETS_REQUESTED, drawId }
                    })
                ])
            );
        })

        .with({ type: CoreMsgType.SET_NAVIGATION }, ({ navigation }) => {
            return singleton({ ...model, navigation });
        })

        .with({ type: CoreMsgType.CLEAR_NAVIGATION }, () => {
            return singleton({ ...model, navigation: null });
        })

        .with({ type: CoreMsgType.SET_IS_EDITING }, ({ isEditing }) => {
            return singleton({ ...model, isEditing });
        })
        .with({ type: CoreMsgType.NAVIGATE_TO_CREATE }, () => {
            if (!model.currentDrawId) return singleton(model);
            return ret(
                model,
                Cmd.navigate(`/lister/bets_create/${model.currentDrawId}`)
            );
        })
        .otherwise(() => singleton(model));
}

export function init(): Return<Model, Msg> {
    const initialModel: Model = {
        error: null,
        currentDrawId: '',
        drawTypeCode: RemoteData.notAsked(),
        isEditing: false,
        navigation: null,
        summary: initialSummary,
        listSession: initialListState,
        entrySession: {
            fijosCorridos: [],
            parlets: [],
            centenas: [],
            loteria: []
        },
        managementSession: initialManagementState,
        createSession: initialCreateState,
        editSession: initialEditState,
        parletSession: initialParletState,
        centenaSession: initialCentenaState,
        loteriaSession: initialLoteriaState,
        rulesSession: initialRulesState,
        successSession: initialSuccessState,
        rewards: createRewardsCache(),
        rules: createRulesCache()
    };

    return singleton(initialModel);
}

export function subscriptions(model: Model): any[] {
    return [];
}