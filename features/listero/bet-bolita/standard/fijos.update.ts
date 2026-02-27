import { singleton, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { BolitaModel as Model, BolitaListData } from '../core/model';
import {
    FijosMsg,
    PROCESS_BET_INPUT,
    SUBMIT_AMOUNT_INPUT
} from './fijos.types';
import { match } from 'ts-pattern';
import { RemoteData } from '@/shared/core/remote.data';
import { generateRandomId } from '@/shared/utils/random';
import { FijosCorridosBet } from '@/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FIJOS_UPDATE');

export function updateFijos(model: Model, msg: FijosMsg): Return<Model, FijosMsg> {
    return match<FijosMsg, Return<Model, FijosMsg>>(msg)
        .with({ type: 'ADD_FIJOS_BET' }, ({ fijosBet }) => {
            const newBet: FijosCorridosBet = {
                id: generateRandomId(),
                bet: fijosBet.number,
                fijoAmount: fijosBet.fijoAmount || 0,
                corridoAmount: fijosBet.corridoAmount || 0,
            };

            if (model.isEditing) {
                // En modo edición, actualizar entrySession
                const updatedEntrySession = {
                    ...model.entrySession,
                    fijosCorridos: [...model.entrySession.fijosCorridos, newBet]
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                    },
                    Cmd.none
                );
            } else {
                // En modo lista, actualizar listState
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    fijosCorridos: [...data.fijosCorridos, newBet],
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                    },
                    Cmd.none
                );
            }
        })

        .with({ type: 'UPDATE_FIJOS_BET' }, ({ betId, changes }) => {
            if (model.isEditing) {
                // En modo edición, actualizar en entrySession
                const updatedEntrySession = {
                    ...model.entrySession,
                    fijosCorridos: model.entrySession.fijosCorridos.map(bet =>
                        bet.id === betId ? { ...bet, ...changes } : bet
                    )
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                    },
                    Cmd.none
                );
            } else {
                // En modo lista, actualizar en listState
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    fijosCorridos: data.fijosCorridos.map((bet: FijosCorridosBet) =>
                        bet.id === betId ? { ...bet, ...changes } : bet
                    ),
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                    },
                    Cmd.none
                );
            }
        })

        .with({ type: 'DELETE_FIJOS_BET' }, ({ betId }) => {
            if (model.isEditing) {
                // En modo edición, eliminar de entrySession
                const updatedEntrySession = {
                    ...model.entrySession,
                    fijosCorridos: model.entrySession.fijosCorridos.filter(bet => bet.id !== betId)
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                    },
                    Cmd.none
                );
            } else {
                // En modo lista, eliminar de listState
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    fijosCorridos: data.fijosCorridos.filter((bet: FijosCorridosBet) => bet.id !== betId),
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                    },
                    Cmd.none
                );
            }
        })

        .with({ type: 'SET_FIJOS_AMOUNT' }, ({ amount }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    currentInput: amount.toString(),
                    editingAmountType: 'fijo',
                },
            });
        })

        .with({ type: 'SET_CORRIDO_AMOUNT' }, ({ amount }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    currentInput: amount.toString(),
                    editingAmountType: 'corrido',
                },
            });
        })

        .with({ type: 'OPEN_BET_KEYBOARD' }, () => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    showBetKeyboard: true,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: 'fijo', // Default to fijo for keyboard context
                    currentInput: '',
                },
            });
        })

        .with({ type: 'CLOSE_BET_KEYBOARD' }, () => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    showBetKeyboard: false,
                },
            });
        })

        .with({ type: 'OPEN_AMOUNT_KEYBOARD' }, ({ betId, amountType }) => {
            const bet = model.isEditing
                ? model.entrySession.fijosCorridos.find(b => b.id === betId)
                : (model.listState.remoteData.type === 'Success'
                    ? model.listState.remoteData.data.fijosCorridos.find((b: FijosCorridosBet) => b.id === betId)
                    : null);

            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    editingBetId: betId,
                    editingAmountType: amountType,
                    showAmountKeyboard: true,
                    showBetKeyboard: false,
                    currentInput: bet ? (amountType === 'fijo' ? (bet.fijoAmount || '') : (bet.corridoAmount || '')).toString() : '',
                },
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
                    currentInput: '',
                },
            });
        })

        .with({ type: 'PROCESS_BET_INPUT' }, ({ inputString }) => {
            // Si el input está vacío, no hacemos nada
            if (!inputString) return singleton(model);

            // Separar el input en grupos de 2 dígitos (ej: 235588 -> [23, 55, 88])
            const betNumbers = inputString.match(/.{1,2}/g);
            if (!betNumbers) return singleton(model);

            const newBets: FijosCorridosBet[] = [];

            for (const numStr of betNumbers) {
                const betNumber = parseInt(numStr, 10);
                if (isNaN(betNumber)) continue;

                newBets.push({
                    id: generateRandomId(),
                    bet: betNumber,
                    fijoAmount: 0,
                    corridoAmount: 0,
                });
            }

            if (newBets.length === 0) return singleton(model);

            if (model.isEditing) {
                const updatedEntrySession = {
                    ...model.entrySession,
                    fijosCorridos: [...model.entrySession.fijosCorridos, ...newBets]
                };

                return singleton({
                    ...model,
                    entrySession: updatedEntrySession,
                    editState: {
                        ...model.editState,
                        showBetKeyboard: false,
                        currentInput: '',
                    }
                });
            } else {
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    fijosCorridos: [...data.fijosCorridos, ...newBets],
                }), model.listState.remoteData);

                return singleton({
                    ...model,
                    listState: {
                        ...model.listState,
                        remoteData: nextRemoteData,
                    },
                    editState: {
                        ...model.editState,
                        showBetKeyboard: false,
                        currentInput: '',
                    }
                });
            }
        })

        .with({ type: 'SUBMIT_AMOUNT_INPUT' }, ({ amountString }) => {
            const { editingBetId, editingAmountType } = model.editState;
            if (!editingBetId || !editingAmountType) return singleton(model);

            const amount = parseInt(amountString, 10);
            if (isNaN(amount)) return singleton(model);

            const changes = editingAmountType === 'fijo' ? { fijoAmount: amount } : { corridoAmount: amount };

            if (model.isEditing) {
                const updatedEntrySession = {
                    ...model.entrySession,
                    fijosCorridos: model.entrySession.fijosCorridos.map(bet =>
                        bet.id === editingBetId ? { ...bet, ...changes } : bet
                    )
                };

                return singleton({
                    ...model,
                    entrySession: updatedEntrySession,
                    editState: {
                        ...model.editState,
                        showAmountKeyboard: false,
                        editingBetId: null,
                        editingAmountType: null,
                        currentInput: '',
                    }
                });
            } else {
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    fijosCorridos: data.fijosCorridos.map((bet: FijosCorridosBet) =>
                        bet.id === editingBetId ? { ...bet, ...changes } : bet
                    ),
                }), model.listState.remoteData);

                return singleton({
                    ...model,
                    listState: {
                        ...model.listState,
                        remoteData: nextRemoteData,
                    },
                    editState: {
                        ...model.editState,
                        showAmountKeyboard: false,
                        editingBetId: null,
                        editingAmountType: null,
                        currentInput: '',
                    }
                });
            }
        })

        .with({ type: 'CONFIRM_APPLY_AMOUNT_ALL' }, () => {
            // Placeholder logic for applying amount to all bets
            return singleton(model);
        })

        .with({ type: 'CONFIRM_APPLY_AMOUNT_SINGLE' }, () => {
            // Placeholder logic for applying amount to a single bet
            return singleton(model);
        })

        .with({ type: 'CANCEL_AMOUNT_CONFIRMATION' }, () => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    amountConfirmationDetails: null,
                }
            });
        })

        .with({ type: 'CONFIRM_PARLET_AUTOFILL' }, () => {
            return singleton(model);
        })

        .with({ type: 'CANCEL_PARLET_AUTOFILL' }, () => {
            return singleton(model);
        })

        .with({ type: 'KEY_PRESSED' }, ({ key }) => {
            let newInput = model.editState.currentInput;
            if (key === 'backspace') {
                newInput = newInput.slice(0, -1);
            } else {
                newInput += key;
            }

            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    currentInput: newInput,
                }
            });
        })

        .with({ type: 'CONFIRM_INPUT' }, () => {
            const { currentInput, showBetKeyboard, showAmountKeyboard } = model.editState;

            if (showBetKeyboard) {
                return updateFijos(model, PROCESS_BET_INPUT({ inputString: currentInput }));
            }

            if (showAmountKeyboard) {
                return updateFijos(model, SUBMIT_AMOUNT_INPUT({ amountString: currentInput }));
            }

            return singleton(model);
        })
        .exhaustive();
}
