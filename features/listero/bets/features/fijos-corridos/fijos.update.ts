import { singleton, ret, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { Model } from '../../core/model';
import { FijosMsg, FijosMsgType, FijosFeatMsg } from './fijos.types';
import { match } from 'ts-pattern';
import { RemoteData } from '@/shared/core/remote.data';
import { generateRandomId } from '@/shared/utils/random';
import { FijosCorridosBet } from '@/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FIJOS_UPDATE');

export function updateFijos(model: Model, msg: FijosMsg): Return<Model, FijosMsg> {
    return match<FijosMsg, Return<Model, FijosMsg>>(msg)
        .with({ type: FijosMsgType.ADD_FIJOS_BET }, ({ fijosBet }) => {
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
                // En modo lista, actualizar listSession
                const nextRemoteData = RemoteData.map((data: any) => ({
                    ...data,
                    fijosCorridos: [...data.fijosCorridos, newBet],
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

        .with({ type: FijosMsgType.UPDATE_FIJOS_BET }, ({ betId, changes }) => {
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
                // En modo lista, actualizar en listSession
                const nextRemoteData = RemoteData.map((data: any) => ({
                    ...data,
                    fijosCorridos: data.fijosCorridos.map((bet: FijosCorridosBet) =>
                        bet.id === betId ? { ...bet, ...changes } : bet
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

        .with({ type: FijosMsgType.DELETE_FIJOS_BET }, ({ betId }) => {
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
                // En modo lista, eliminar de listSession
                const nextRemoteData = RemoteData.map((data: any) => ({
                    ...data,
                    fijosCorridos: data.fijosCorridos.filter((bet: FijosCorridosBet) => bet.id !== betId),
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

        .with({ type: FijosMsgType.SET_FIJOS_AMOUNT }, ({ amount }) => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    currentInput: amount.toString(),
                    editingAmountType: 'fijo',
                },
            });
        })

        .with({ type: FijosMsgType.SET_CORRIDO_AMOUNT }, ({ amount }) => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    currentInput: amount.toString(),
                    editingAmountType: 'corrido',
                },
            });
        })

        .with({ type: FijosMsgType.OPEN_BET_KEYBOARD }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: true,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: 'fijo', // Default to fijo for keyboard context
                    currentInput: '',
                },
            });
        })

        .with({ type: FijosMsgType.CLOSE_BET_KEYBOARD }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: false,
                },
            });
        })

        .with({ type: FijosMsgType.OPEN_AMOUNT_KEYBOARD }, ({ betId, amountType }) => {
            const bet = model.isEditing
                ? model.entrySession.fijosCorridos.find(b => b.id === betId)
                : (model.listSession.remoteData.type === 'Success'
                    ? (model.listSession.remoteData.data as any).fijosCorridos.find((b: FijosCorridosBet) => b.id === betId)
                    : null);

            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    editingBetId: betId,
                    editingAmountType: amountType,
                    showAmountKeyboard: true,
                    showBetKeyboard: false,
                    currentInput: bet ? (amountType === 'fijo' ? (bet.fijoAmount || '') : (bet.corridoAmount || '')).toString() : '',
                },
            });
        })

        .with({ type: FijosMsgType.CLOSE_AMOUNT_KEYBOARD }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    currentInput: '',
                },
            });
        })

        .with({ type: FijosMsgType.PROCESS_BET_INPUT }, ({ inputString }) => {
            // Si el input está vacío, no hacemos nada
            if (!inputString) return singleton(model);

            // Separar el input en grupos de 2 dígitos (ej: 235588 -> [23, 55, 88])
            const betNumbers = inputString.match(/.{1,2}/g);
            if (!betNumbers) return singleton(model);

            let currentModel = model;
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
                    editSession: {
                        ...model.editSession,
                        showBetKeyboard: false,
                        currentInput: '',
                    }
                });
            } else {
                const nextRemoteData = RemoteData.map((data: any) => ({
                    ...data,
                    fijosCorridos: [...data.fijosCorridos, ...newBets],
                }), model.listSession.remoteData);

                return singleton({
                    ...model,
                    listSession: {
                        ...model.listSession,
                        remoteData: nextRemoteData,
                    },
                    editSession: {
                        ...model.editSession,
                        showBetKeyboard: false,
                        currentInput: '',
                    }
                });
            }
        })

        .with({ type: FijosMsgType.KEY_PRESSED }, ({ key }) => {
            const currentInput = model.editSession.currentInput;
            let newInput = currentInput;

            if (key === 'backspace') {
                newInput = currentInput.slice(0, -1);
            } else if (key === 'clear') {
                newInput = '';
            } else if (/^\d$/.test(key)) {
                // Solo permitir números
                newInput = currentInput + key;
            }

            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    currentInput: newInput,
                },
            });
        })

        .with({ type: FijosMsgType.SUBMIT_AMOUNT_INPUT }, () => {
            const amount = parseFloat(model.editSession.currentInput) || 0;
            const editingBetId = model.editSession.editingBetId;
            const amountType = model.editSession.editingAmountType;

            if (!editingBetId || (amountType !== 'fijo' && amountType !== 'corrido')) {
                return singleton(model);
            }

            // En lugar de aplicar directamente, mostramos la alerta de confirmación
            const nextModel: Model = {
                ...model,
                editSession: {
                    ...model.editSession,
                    showAmountKeyboard: false, // Ocultar el teclado antes de la alerta
                    amountConfirmationDetails: {
                        amountValue: amount,
                        intendedAmountType: amountType,
                        intendedBetId: editingBetId,
                    }
                }
            };

            return ret(
                nextModel,
                Cmd.alert({
                    title: 'Actualizar Monto',
                    message: `¿Desea aplicar el monto ${amount} solo a esta apuesta o a todas las de tipo ${amountType}?`,
                    buttons: [
                        {
                            text: 'Solo a este',
                            onPressMsg: { type: FijosMsgType.CONFIRM_APPLY_AMOUNT_SINGLE } as FijosMsg,
                        },
                        {
                            text: 'A todos',
                            onPressMsg: { type: FijosMsgType.CONFIRM_APPLY_AMOUNT_ALL } as FijosMsg,
                        },
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                            onPressMsg: { type: FijosMsgType.CANCEL_AMOUNT_CONFIRMATION } as FijosMsg,
                        }
                    ]
                })
            );
        })

        .with({ type: FijosMsgType.CONFIRM_APPLY_AMOUNT_SINGLE }, () => {
            const details = model.editSession.amountConfirmationDetails;
            if (!details || !details.intendedBetId) return singleton(model);

            const { amountValue, intendedAmountType, intendedBetId } = details;
            const changes = intendedAmountType === 'fijo'
                ? { fijoAmount: amountValue }
                : { corridoAmount: amountValue };

            return updateFijos(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: '',
                        editingBetId: null,
                        editingAmountType: null,
                        showAmountKeyboard: false,
                        amountConfirmationDetails: null,
                    },
                },
                { type: FijosMsgType.UPDATE_FIJOS_BET, betId: intendedBetId, changes }
            );
        })

        .with({ type: FijosMsgType.CONFIRM_APPLY_AMOUNT_ALL }, () => {
            const details = model.editSession.amountConfirmationDetails;
            log.debug('Confirm Apply Amount All Details', details);
            if (!details) return singleton(model);

            const { amountValue, intendedAmountType } = details;
            const changes = intendedAmountType === 'fijo'
                ? { fijoAmount: amountValue }
                : { corridoAmount: amountValue };

            let updatedModel = {
                ...model,
                editSession: {
                    ...model.editSession,
                    currentInput: '',
                    editingBetId: null,
                    editingAmountType: null,
                    showAmountKeyboard: false,
                    amountConfirmationDetails: null,
                },
            };

            if (model.isEditing) {
                updatedModel = {
                    ...updatedModel,
                    entrySession: {
                        ...model.entrySession,
                        fijosCorridos: model.entrySession.fijosCorridos.map(bet => ({
                            ...bet,
                            ...changes
                        }))
                    }
                };
            } else {
                const nextRemoteData = RemoteData.map((data: any) => ({
                    ...data,
                    fijosCorridos: data.fijosCorridos.map((bet: FijosCorridosBet) => ({
                        ...bet,
                        ...changes
                    })),
                }), model.listSession.remoteData);

                updatedModel = {
                    ...updatedModel,
                    listSession: {
                        ...model.listSession,
                        remoteData: nextRemoteData,
                    }
                };
            }

            return singleton(updatedModel);
        })

        .with({ type: FijosMsgType.CANCEL_AMOUNT_CONFIRMATION }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    amountConfirmationDetails: null,
                },
            });
        })

        .with({ type: FijosMsgType.CONFIRM_INPUT }, () => {
            if (model.editSession.showBetKeyboard) {
                return updateFijos(model, {
                    type: FijosMsgType.PROCESS_BET_INPUT,
                    inputString: model.editSession.currentInput
                });
            } else if (model.editSession.showAmountKeyboard) {
                return updateFijos(model, {
                    type: FijosMsgType.SUBMIT_AMOUNT_INPUT,
                    amountString: model.editSession.currentInput
                });
            }
            return singleton(model);
        })

        .otherwise(() => {
            log.warn('Unhandled fijos message type:', msg);
            return singleton(model);
        });
}