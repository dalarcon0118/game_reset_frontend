import { singleton, ret, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { Model } from '../../core/model';
import { ParletMsg, ParletMsgType } from './parlet.types';
import { match } from 'ts-pattern';
import { RemoteData } from '@/shared/core/remote.data';
import { generateRandomId } from '../../shared/utils/numbers';
import { ParletBet } from '@/types';

export function updateParlet(model: Model, msg: ParletMsg): Return<Model, ParletMsg> {
    return match<ParletMsg, Return<Model, ParletMsg>>(msg)
        .with({ type: ParletMsgType.CONFIRM_PARLET_BET }, () => {
            if (!model.parletSession.fromFijosyCorridoBet || model.parletSession.potentialParletNumbers.length < 2) {
                return singleton(model);
            }

            // Create a new parlet bet from the potential numbers
            const newParlet: ParletBet = {
                id: generateRandomId(),
                bets: model.parletSession.potentialParletNumbers,
                amount: 0, // Will be set later
            };

            if (model.isEditing) {
                // En modo edición, actualizar entrySession directamente
                const updatedEntrySession = {
                    ...model.entrySession,
                    parlets: [...model.entrySession.parlets, newParlet]
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                        editSession: {
                            ...model.editSession,
                            editingAmountType: 'parlet',
                            editingBetId: newParlet.id,
                            currentInput: '',
                            showAmountKeyboard: true,
                            showBetKeyboard: false,
                        },
                        parletSession: {
                            ...model.parletSession,
                            potentialParletNumbers: [],
                            fromFijosyCorridoBet: false,
                            parletAlertVisibleState: false,
                            activeParletBetId: newParlet.id,
                        },
                    },
                    Cmd.none
                );
            } else {
                // En modo lista, actualizar listSession como antes
                const nextRemoteData = RemoteData.map((data: any) => ({
                    ...data,
                    parlets: [...data.parlets, newParlet],
                }), model.listSession.remoteData);

                return Return.val(
                    {
                        ...model,
                        listSession: {
                            ...model.listSession,
                            remoteData: nextRemoteData,
                        },
                        editSession: {
                            ...model.editSession,
                            editingAmountType: 'parlet',
                            editingBetId: newParlet.id,
                            currentInput: '',
                            showAmountKeyboard: true,
                            showBetKeyboard: false,
                        },
                        parletSession: {
                            ...model.parletSession,
                            potentialParletNumbers: [],
                            fromFijosyCorridoBet: false,
                            parletAlertVisibleState: false,
                            activeParletBetId: newParlet.id,
                        },
                    },
                    Cmd.none
                );
            }
        })

        .with({ type: ParletMsgType.DELETE_PARLET_BET }, ({ betId }) => {
            if (model.isEditing) {
                // En modo edición, eliminar de entrySession
                const updatedEntrySession = {
                    ...model.entrySession,
                    parlets: model.entrySession.parlets.filter(parlet => parlet.id !== betId)
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                        parletSession: {
                            ...model.parletSession,
                            activeParletBetId: null
                        }
                    },
                    Cmd.none
                );
            } else {
                // En modo lista, eliminar de listSession
                const nextRemoteData = RemoteData.map((data: any) => ({
                    ...data,
                    parlets: data.parlets.filter((parlet: ParletBet) => parlet.id !== betId),
                }), model.listSession.remoteData);

                return Return.val(
                    {
                        ...model,
                        listSession: {
                            ...model.listSession,
                            remoteData: nextRemoteData,
                        },
                        parletSession: {
                            ...model.parletSession,
                            activeParletBetId: null
                        }
                    },
                    Cmd.none
                );
            }
        })

        .with({ type: ParletMsgType.UPDATE_PARLET_BET }, ({ betId, changes }) => {
            if (model.isEditing) {
                // En modo edición, actualizar en entrySession
                const updatedEntrySession = {
                    ...model.entrySession,
                    parlets: model.entrySession.parlets.map(parlet =>
                        parlet.id === betId ? { ...parlet, ...changes } : parlet
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
                // En modo lista, actualizar en listSession
                const nextRemoteData = RemoteData.map((data: any) => ({
                    ...data,
                    parlets: data.parlets.map((parlet: ParletBet) =>
                        parlet.id === betId ? { ...parlet, ...changes } : parlet
                    ),
                }), model.listSession.remoteData);

                return Return.val(
                    {
                        ...model,
                        listSession: {
                            ...model.listSession,
                            remoteData: nextRemoteData,
                        },
                    },
                    Cmd.none
                );
            }
        })

        .with({ type: ParletMsgType.EDIT_PARLET_BET }, ({ betId }) => {
            return Return.val(
                {
                    ...model,
                    parletSession: {
                        ...model.parletSession,
                        activeParletBetId: betId,
                    },
                    editSession: {
                        ...model.editSession,
                        editingAmountType: 'parlet',
                        editingBetId: betId,
                    },
                },
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.OPEN_PARLET_AMOUNT_KEYBOARD }, ({ betId }) => {
            const parlet = model.isEditing
                ? model.entrySession.parlets.find(p => p.id === betId)
                : (model.listSession.remoteData.type === 'Success'
                    ? model.listSession.remoteData.data.parlets.find((p: ParletBet) => p.id === betId)
                    : null);

            if (!parlet) {
                return singleton(model);
            }

            return Return.val(
                {
                    ...model,
                    parletSession: {
                        ...model.parletSession,
                        activeParletBetId: betId,
                    },
                    editSession: {
                        ...model.editSession,
                        editingAmountType: 'parlet',
                        editingBetId: betId,
                        currentInput: parlet.amount?.toString() || '',
                        showAmountKeyboard: true,
                        showBetKeyboard: false,
                    },
                },
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.CLOSE_AMOUNT_KEYBOARD }, () => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        showAmountKeyboard: false,
                        editingBetId: null,
                        editingAmountType: null,
                        currentInput: '',
                    },
                },
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.KEY_PRESSED }, ({ key }) => {
            const currentInput = model.editSession.currentInput;
            const newInput = key === 'backspace'
                ? currentInput.slice(0, -1)
                : currentInput + key;

            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: newInput,
                    },
                },
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.SUBMIT_AMOUNT_INPUT }, ({ amountString }) => {
            const amount = parseFloat(amountString || model.editSession.currentInput) || 0;
            const betId = model.editSession.editingBetId;

            if (!betId || model.editSession.editingAmountType !== 'parlet') {
                return singleton(model);
            }

            // Usar UPDATE_PARLET_BET para actualizar el monto
            return updateParlet(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: '',
                        editingBetId: null,
                        showAmountKeyboard: false,
                        editingAmountType: null,
                    },
                },
                { type: ParletMsgType.UPDATE_PARLET_BET, betId, changes: { amount } }
            );
        })

        .with({ type: ParletMsgType.CONFIRM_INPUT }, () => {
            return updateParlet(
                model,
                { type: ParletMsgType.SUBMIT_AMOUNT_INPUT, amountString: model.editSession.currentInput }
            );
        })

        .with({ type: ParletMsgType.SHOW_PARLET_DRAWER }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    parletSession: {
                        ...model.parletSession,
                        isParletDrawerVisible: visible
                    },
                },
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.SHOW_PARLET_MODAL }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    parletSession: {
                        ...model.parletSession,
                        isParletModalVisible: visible
                    },
                },
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.SHOW_PARLET_ALERT }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    parletSession: {
                        ...model.parletSession,
                        parletAlertVisibleState: visible,
                    },
                },
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.PROCESS_BET_INPUT }, ({ inputString }) => {
            // Process bet input logic here
            return singleton(model);
        })

        .with({ type: ParletMsgType.PRESS_ADD_PARLET }, ({ fijosCorridosList }) => {
            const numbers = fijosCorridosList.map(bet => bet.bet);

            if (numbers.length < 2) {
                return singleton(model);
            }

            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        showBetKeyboard: true,
                        editingAmountType: 'parlet',
                        currentInput: '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        potentialParletNumbers: numbers,
                        fromFijosyCorridoBet: true,
                        parletAlertVisibleState: true,
                    },
                },
                Cmd.alert({
                    title: 'Crear Parlet',
                    message: `¿Deseas crear un parlet con los números: ${numbers.join(', ')}?`,
                    buttons: [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                            onPressMsg: { type: ParletMsgType.CANCEL_PARLET_BET } as ParletMsg
                        },
                        {
                            text: 'Crear',
                            onPressMsg: { type: ParletMsgType.CONFIRM_PARLET_BET } as ParletMsg
                        }
                    ]
                })
            );
        })

        .with({ type: ParletMsgType.CANCEL_PARLET_BET }, () => {
            return singleton({
                ...model,
                parletSession: {
                    ...model.parletSession,
                    potentialParletNumbers: [],
                    fromFijosyCorridoBet: false,
                    canceledFromFijosyCorridoBet: true
                }
            });
        })

        .otherwise(() => {
            console.warn('Unhandled parlet message type:', msg);
            return singleton(model);
        });
}