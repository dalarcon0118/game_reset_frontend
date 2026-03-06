import { match } from 'ts-pattern';
import { BolitaModel } from '../domain/models/bolita.types';
import { ListMsg, ListMsgType, EditMsg, EditMsgType, FijosMsg, ParletMsg, CentenaMsg } from '../domain/models/bolita.messages';
import { Return, ret, singleton, Cmd, RemoteData } from '@/shared/core/tea-utils';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { BolitaImpl } from '../domain/bolita.impl';

/**
 * Update logic for the Fijos sub-feature.
 */
export const updateFijos = (model: BolitaModel, msg: FijosMsg): Return<BolitaModel, FijosMsg> => {
    return match<FijosMsg, Return<BolitaModel, FijosMsg>>(msg)
        .with({ type: 'OPEN_BET_KEYBOARD' }, () => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    activeOwner: 'fijos',
                    showBetKeyboard: true,
                    currentInput: ''
                }
            });
        })
        .with({ type: 'CLOSE_BET_KEYBOARD' }, () => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    showBetKeyboard: false,
                    currentInput: ''
                }
            });
        })
        .with({ type: 'OPEN_AMOUNT_KEYBOARD' }, ({ payload: { betId, amountType } }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    activeOwner: 'fijos',
                    showAmountKeyboard: true,
                    editingBetId: betId,
                    editingAmountType: amountType,
                    currentInput: ''
                }
            });
        })
        .with({ type: 'CLOSE_AMOUNT_KEYBOARD' }, () => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    currentInput: ''
                }
            });
        })
        .with({ type: 'ADD_FIJOS_BET' }, ({ payload: { fijosBet } }) => {
            const newBet = {
                id: Math.random().toString(36).substr(2, 9),
                bet: fijosBet.number,
                fijoAmount: fijosBet.fijoAmount || 0,
                corridoAmount: fijosBet.corridoAmount || 0,
            };

            const updatedEntrySession = {
                ...model.entrySession,
                fijosCorridos: [...model.entrySession.fijosCorridos, newBet]
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'UPDATE_FIJOS_BET' }, ({ payload: { betId, changes } }) => {
            const updatedEntrySession = {
                ...model.entrySession,
                fijosCorridos: model.entrySession.fijosCorridos.map(b =>
                    b.id === betId ? { ...b, ...changes } : b
                )
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'DELETE_FIJOS_BET' }, ({ payload: { betId } }) => {
            const updatedEntrySession = {
                ...model.entrySession,
                fijosCorridos: model.entrySession.fijosCorridos.filter(b => b.id !== betId)
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'FIJOS_CONFIRM_INPUT' }, () => {
            return singleton(model);
        })
        .otherwise(() => singleton(model));
};

/**
 * Update logic for the Parlet sub-feature.
 */
export const updateParlet = (model: BolitaModel, msg: ParletMsg): Return<BolitaModel, ParletMsg> => {
    return match<ParletMsg, Return<BolitaModel, ParletMsg>>(msg)
        .with({ type: 'SHOW_PARLET_DRAWER' }, ({ payload: { visible } }) => {
            return singleton({
                ...model,
                parletSession: {
                    ...model.parletSession,
                    isParletDrawerVisible: visible
                }
            });
        })
        .with({ type: 'PRESS_ADD_PARLET' }, ({ payload: { fijosCorridosList } }) => {
            const numbers = fijosCorridosList.map(f => f.bet);
            if (!BolitaImpl.validation.isValidParlet(numbers)) {
                return singleton(model);
            }

            const newParlet = {
                id: Math.random().toString(36).substr(2, 9),
                bets: numbers,
                amount: 0,
                type: 'parlet' as const
            };

            const updatedEntrySession = {
                ...model.entrySession,
                parlets: [...model.entrySession.parlets, newParlet]
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'DELETE_PARLET_BET' }, ({ payload: { betId } }) => {
            const updatedEntrySession = {
                ...model.entrySession,
                parlets: model.entrySession.parlets.filter(p => p.id !== betId)
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'UPDATE_PARLET_BET' }, ({ payload: { betId, changes } }) => {
            const updatedEntrySession = {
                ...model.entrySession,
                parlets: model.entrySession.parlets.map(p =>
                    p.id === betId ? { ...p, ...changes } : p
                )
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'OPEN_PARLET_AMOUNT_KEYBOARD' }, ({ payload: { betId } }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    activeOwner: 'parlet',
                    showAmountKeyboard: true,
                    editingBetId: betId,
                    editingAmountType: 'parlet',
                    currentInput: ''
                }
            });
        })
        .otherwise(() => singleton(model));
};

/**
 * Update logic for the Centena sub-feature.
 */
export const updateCentena = (model: BolitaModel, msg: CentenaMsg): Return<BolitaModel, CentenaMsg> => {
    return match<CentenaMsg, Return<BolitaModel, CentenaMsg>>(msg)
        .with({ type: 'SHOW_CENTENA_DRAWER' }, ({ payload: { visible } }) => {
            return singleton({
                ...model,
                centenaSession: {
                    ...model.centenaSession,
                    isCentenaDrawerVisible: visible
                }
            });
        })
        .with({ type: 'PRESS_ADD_CENTENA' }, () => {
            const newCentena = {
                id: Math.random().toString(36).substr(2, 9),
                bet: 0,
                amount: 0,
                type: 'centena' as const
            };

            const updatedEntrySession = {
                ...model.entrySession,
                centenas: [...model.entrySession.centenas, newCentena]
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'DELETE_CENTENA_BET' }, ({ payload: { betId } }) => {
            const updatedEntrySession = {
                ...model.entrySession,
                centenas: model.entrySession.centenas.filter(c => c.id !== betId)
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'UPDATE_CENTENA_BET' }, ({ payload: { betId, changes } }) => {
            const updatedEntrySession = {
                ...model.entrySession,
                centenas: model.entrySession.centenas.map(c =>
                    c.id === betId ? { ...c, ...changes } : c
                )
            };

            const newModel = {
                ...model,
                entrySession: updatedEntrySession,
            };

            return singleton({
                ...newModel,
                summary: BolitaImpl.calculation.calculateSummary(newModel)
            });
        })
        .with({ type: 'OPEN_CENTENA_AMOUNT_KEYBOARD' }, ({ payload: { betId } }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    activeOwner: 'centena',
                    showAmountKeyboard: true,
                    editingBetId: betId,
                    editingAmountType: 'centena',
                    currentInput: ''
                }
            });
        })
        .otherwise(() => singleton(model));
};

/**
 * Update logic for the List sub-feature.
 */
export const updateList = (model: BolitaModel, msg: ListMsg): Return<BolitaModel, ListMsg> => {
    return match<ListMsg, Return<BolitaModel, ListMsg>>(msg)
        .with({ type: ListMsgType.FETCH_BETS_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    listState: { ...model.listState, remoteData: RemoteData.loading() }
                },
                Cmd.task({
                    task: async () => {
                        const result = await betRepository.getBets({ drawId });
                        if (result.isErr()) throw result.error;
                        return result.value;
                    },
                    onSuccess: (bets) => ({
                        type: ListMsgType.FETCH_BETS_RECEIVED,
                        webData: RemoteData.success(BolitaImpl.persistence.transformBets(bets))
                    }),
                    onFailure: (err) => ({
                        type: ListMsgType.FETCH_BETS_RECEIVED,
                        webData: RemoteData.failure(err as Error)
                    })
                })
            );
        })
        .with({ type: ListMsgType.FETCH_BETS_RECEIVED }, ({ webData }) => {
            return singleton({
                ...model,
                listState: { ...model.listState, remoteData: webData }
            });
        })
        .with({ type: ListMsgType.REFRESH_BETS_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    listState: { ...model.listState, isRefreshing: true }
                },
                Cmd.task({
                    task: async () => {
                        const result = await betRepository.getBets({ drawId });
                        if (result.isErr()) throw result.error;
                        return result.value;
                    },
                    onSuccess: (bets) => ({
                        type: ListMsgType.REFRESH_BETS_RECEIVED,
                        webData: RemoteData.success(BolitaImpl.persistence.transformBets(bets))
                    }),
                    onFailure: (err) => ({
                        type: ListMsgType.REFRESH_BETS_RECEIVED,
                        webData: RemoteData.failure(err as Error)
                    })
                })
            );
        })
        .with({ type: ListMsgType.REFRESH_BETS_RECEIVED }, ({ webData }) => {
            return singleton({
                ...model,
                listState: { ...model.listState, remoteData: webData, isRefreshing: false }
            });
        })
        .otherwise(() => singleton(model));
};

/**
 * Update logic for the Edit sub-feature.
 */
export const updateEdit = (model: BolitaModel, msg: EditMsg): Return<BolitaModel, EditMsg> => {
    return match<EditMsg, Return<BolitaModel, EditMsg>>(msg)
        .with({ type: EditMsgType.SET_EDIT_SELECTED_COLUMN }, ({ column }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    selectedColumn: column
                }
            });
        })
        .with({ type: EditMsgType.SET_EDIT_SELECTED_CIRCLE }, ({ circle }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    selectedCircle: circle
                }
            });
        })
        .with({ type: EditMsgType.TOGGLE_RANGE_MODE }, ({ enabled }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    isRangeMode: enabled
                }
            });
        })
        .with({ type: EditMsgType.SET_RANGE_TYPE }, ({ rangeType }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    rangeType
                }
            });
        })
        .with({ type: EditMsgType.GENERATE_RANGE_BETS }, () => {
            return singleton(model);
        })
        .with({ type: EditMsgType.UPDATE_EDIT_INPUT }, ({ value }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    currentInput: value
                }
            });
        })
        .exhaustive();
};
