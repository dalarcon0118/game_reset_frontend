import { match } from 'ts-pattern';
import { Model } from '../../core/model';
import { FijosMsg, FijosMsgType } from './fijos.types';
import { Cmd } from '@/shared/core/cmd';
import { FijosCorridosBet } from '@/types';
import { Return, singleton, ret } from '@/shared/core/return';
import { AnnotationTypes, GameTypes } from '@/constants/Bet';
import { splitStringToPairs, generateRandomId } from '../../shared/utils/numbers';
import { RemoteData } from '@/shared/core/remote.data';
import { ListData } from '../bet-list/list.types';

type BetAmountType = 'fijo' | 'corrido';

const updateSingleBetAmount = (model: Model, betId: string, type: BetAmountType, amount: number): Model => {
    const nextRemoteData = RemoteData.map((data: ListData) => ({
        ...data,
        fijosCorridos: data.fijosCorridos.map((b: FijosCorridosBet) =>
            b.id === betId
                ? { ...b, [type === 'fijo' ? 'fijoAmount' : 'corridoAmount']: amount }
                : b
        )
    }), model.listSession.remoteData);

    return {
        ...model,
        listSession: {
            ...model.listSession,
            remoteData: nextRemoteData,
        },
        editSession: {
            ...model.editSession,
            currentInput: '',
            showAmountKeyboard: false,
            editingBetId: null,
            editingAmountType: null,
        }
    };
};

const updateBufferedBetsAmount = (model: Model, type: BetAmountType, amount: number): Model => {
    const { editSession, listSession } = model;
    const { betBuffer } = editSession;

    const nextRemoteData = RemoteData.map((data: ListData) => ({
        ...data,
        fijosCorridos: data.fijosCorridos.map((b: FijosCorridosBet) =>
            betBuffer.includes(b.bet)
                ? { ...b, [type === 'fijo' ? 'fijoAmount' : 'corridoAmount']: amount }
                : b
        ),
    }), listSession.remoteData);

    return {
        ...model,
        listSession: {
            ...listSession,
            remoteData: nextRemoteData,
        },
        editSession: {
            ...editSession,
            currentInput: '',
        }
    };
};

const getUniqueNumbersFromParlets = (parlets: any[]): number[] => {
    const allNumbers = parlets.flatMap(p => p.bets);
    return [...new Set(allNumbers)].sort((a, b) => a - b);
};

export const updateFijos = (model: Model, msg: FijosMsg): Return<Model, FijosMsg> => {
    const listData = RemoteData.withDefault({ fijosCorridos: [], parlets: [], centenas: [] } as ListData, model.listSession.remoteData);

    return match<FijosMsg, Return<Model, FijosMsg>>(msg)
        .with({ type: FijosMsgType.OPEN_BET_KEYBOARD }, () => {
            const parletNumbers = getUniqueNumbersFromParlets(listData.parlets);
            const existingFijoNumbers = listData.fijosCorridos.map((b: FijosCorridosBet) => b.bet);
            const missingNumbers = parletNumbers.filter(n => !existingFijoNumbers.includes(n));

            if (missingNumbers.length > 0) {
                return Return.val(
                    {
                        ...model,
                        editSession: {
                            ...model.editSession,
                            showBetKeyboard: false,
                        }
                    },
                    Cmd.alert({
                        title: "¿Desea agregar los números de los Parlets?",
                        message: `Se agregarán [${missingNumbers.join(', ')}] a la columna de Fijos y Corridos.`,
                        buttons: [
                            { text: "Cancelar", onPressMsg: { type: FijosMsgType.CANCEL_PARLET_AUTOFILL }, style: "cancel" },
                            { text: "OK", onPressMsg: { type: FijosMsgType.CONFIRM_PARLET_AUTOFILL, numbers: missingNumbers } }
                        ]
                    })
                );
            }

            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: true,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    amountConfirmationDetails: null,
                    currentInput: '',
                    betBuffer: [], // Iniciamos un nuevo buffer al abrir el teclado de apuestas
                },
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: AnnotationTypes.Bet,
                    activeGameType: {
                        id: 'fijos_corridos',
                        name: 'Fijos y Corridos',
                        code: 'fijo', // Usamos 'fijo' como código base para este modo
                        description: 'Fijos y Corridos'
                    },
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
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    editingBetId: betId,
                    editingAmountType: amountType,
                    showAmountKeyboard: true,
                    showBetKeyboard: false,
                    amountConfirmationDetails: null, // Aseguramos que esté limpio al abrir
                    currentInput: '',
                },
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: AnnotationTypes.Amount,
                    activeGameType: {
                        id: 'fijos_corridos',
                        name: 'Fijos y Corridos',
                        code: 'fijo',
                        description: 'Fijos y Corridos'
                    },
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
                    amountConfirmationDetails: null,
                },
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: null,
                },
            });
        })
        .with({ type: FijosMsgType.PROCESS_BET_INPUT }, ({ inputString }) => {
            if (model.parletSession.activeAnnotationType !== AnnotationTypes.Bet ||
                model.parletSession.activeGameType?.id !== 'fijos_corridos') {
                return singleton(model);
            }

            const pairs = splitStringToPairs(inputString);
            const newBets: FijosCorridosBet[] = [];
            const newBetNumbers: number[] = [];

            pairs.forEach((pair: string) => {
                if (pair.length === 2) {
                    const betNumber = parseInt(pair, 10);
                    if (!isNaN(betNumber)) {
                        newBets.push({
                            id: generateRandomId(),
                            bet: betNumber,
                            fijoAmount: null,
                            corridoAmount: null,
                        });
                        newBetNumbers.push(betNumber);
                    }
                }
            });

            if (newBets.length > 0) {
                const nextRemoteData = RemoteData.map((data: ListData) => ({
                    ...data,
                    fijosCorridos: [...data.fijosCorridos, ...newBets]
                }), model.listSession.remoteData);

                return singleton({
                    ...model,
                    listSession: {
                        ...model.listSession,
                        remoteData: nextRemoteData,
                    },
                    editSession: {
                        ...model.editSession,
                        betBuffer: [...model.editSession.betBuffer, ...newBetNumbers],
                        showBetKeyboard: false,
                        currentInput: '',
                    },
                });
            }

            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: false,
                    currentInput: '',
                },
            });
        })
        .with({ type: FijosMsgType.SUBMIT_AMOUNT_INPUT }, ({ amountString }) => {
            const { parletSession, editSession } = model;
            const { activeAnnotationType } = parletSession;
            const { editingAmountType, editingBetId, betBuffer } = editSession;
            const { fijosCorridos } = listData;

            if (activeAnnotationType !== AnnotationTypes.Amount || !editingAmountType || amountString === '') {
                return singleton({
                    ...model,
                    editSession: {
                        ...editSession,
                        showAmountKeyboard: false,
                        editingBetId: null,
                        editingAmountType: null,
                        amountConfirmationDetails: null,
                        currentInput: '',
                    },
                    parletSession: {
                        ...parletSession,
                        activeAnnotationType: null,
                    },
                });
            }

            const amountValue = parseInt(amountString, 10);
            if (isNaN(amountValue)) {
                return singleton({
                    ...model,
                    editSession: {
                        ...editSession,
                        showAmountKeyboard: false,
                        editingBetId: null,
                        editingAmountType: null,
                        amountConfirmationDetails: null,
                        currentInput: '',
                    },
                    parletSession: {
                        ...parletSession,
                        activeAnnotationType: null,
                    },
                });
            }

            const editingBetObject = fijosCorridos.find((b: FijosCorridosBet) => b.id === editingBetId);

            if (betBuffer.length > 1 && editingBetId && editingBetObject && betBuffer.includes(editingBetObject.bet)) {
                return ret<Model, FijosMsg>(
                    {
                        ...model,
                        editSession: {
                            ...editSession,
                            amountConfirmationDetails: {
                                amountValue,
                                intendedAmountType: editingAmountType as any,
                                intendedBetId: editingBetId,
                            },
                            showAmountKeyboard: false,
                        },
                    },
                    Cmd.alert({
                        title: "Confirmar Monto",
                        message: `Desea colocar ${amountValue} a todos los números anteriores en ${editingAmountType === 'fijo' ? GameTypes.FIJO : GameTypes.CORRIDO}?`,
                        buttons: [
                            {
                                text: "Cancelar",
                                style: "cancel",
                                onPressMsg: { type: FijosMsgType.CANCEL_AMOUNT_CONFIRMATION }
                            },
                            {
                                text: "Sólo a éste",
                                onPressMsg: { type: FijosMsgType.CONFIRM_APPLY_AMOUNT_SINGLE }
                            },
                            {
                                text: "Sí, a todos",
                                onPressMsg: { type: FijosMsgType.CONFIRM_APPLY_AMOUNT_ALL }
                            }
                        ]
                    })
                );
            } else {
                return singleton(updateSingleBetAmount(model, editingBetId!, editingAmountType as BetAmountType, amountValue));
            }
        })
        .with({ type: FijosMsgType.CONFIRM_APPLY_AMOUNT_ALL }, () => {
            const { editSession } = model;
            const { amountConfirmationDetails } = editSession;
            if (!amountConfirmationDetails) return singleton(model);

            const updatedModel = updateBufferedBetsAmount(
                model,
                amountConfirmationDetails.intendedAmountType as BetAmountType,
                amountConfirmationDetails.amountValue
            );

            return singleton({
                ...updatedModel,
                editSession: {
                    ...updatedModel.editSession,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    amountConfirmationDetails: null,
                },
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: null,
                },
            });
        })
        .with({ type: FijosMsgType.CONFIRM_APPLY_AMOUNT_SINGLE }, () => {
            const { editSession } = model;
            const { amountConfirmationDetails } = editSession;
            if (!amountConfirmationDetails || !amountConfirmationDetails.intendedBetId) return singleton(model);

            const updatedModel = updateSingleBetAmount(
                model,
                amountConfirmationDetails.intendedBetId,
                amountConfirmationDetails.intendedAmountType as BetAmountType,
                amountConfirmationDetails.amountValue
            );

            return singleton({
                ...updatedModel,
                editSession: {
                    ...updatedModel.editSession,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    amountConfirmationDetails: null,
                },
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: null,
                },
            });
        })
        .with({ type: FijosMsgType.CANCEL_AMOUNT_CONFIRMATION }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    amountConfirmationDetails: null,
                },
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: null,
                },
            });
        })
        .with({ type: FijosMsgType.CONFIRM_PARLET_AUTOFILL }, ({ numbers }) => {
            const newBets: FijosCorridosBet[] = numbers.map(n => ({
                id: generateRandomId(),
                bet: n,
                fijoAmount: null,
                corridoAmount: null,
            }));

            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                fijosCorridos: [...data.fijosCorridos, ...newBets]
            }), model.listSession.remoteData);

            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: nextRemoteData,
                },
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: true,
                    betBuffer: [...model.editSession.betBuffer, ...numbers],
                    currentInput: '',
                },
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: AnnotationTypes.Bet,
                    activeGameType: {
                        id: 'fijos_corridos',
                        name: 'Fijos y Corridos',
                        code: 'fijo',
                        description: 'Fijos y Corridos'
                    },
                },
            });
        })
        .with({ type: FijosMsgType.CANCEL_PARLET_AUTOFILL }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: true,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    amountConfirmationDetails: null,
                    currentInput: '',
                },
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: AnnotationTypes.Bet,
                    activeGameType: {
                        id: 'fijos_corridos',
                        name: 'Fijos y Corridos',
                        code: 'fijo',
                        description: 'Fijos y Corridos'
                    },
                },
            });
        })
        .with({ type: FijosMsgType.KEY_PRESSED }, ({ key }) => {
            let newInput = model.editSession.currentInput;
            if (key === 'backspace') {
                newInput = newInput.slice(0, -1);
            } else {
                newInput += key;
            }

            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    currentInput: newInput,
                }
            });
        })
        .with({ type: FijosMsgType.CONFIRM_INPUT }, () => {
            const { currentInput, showBetKeyboard, showAmountKeyboard } = model.editSession;

            if (showBetKeyboard) {
                return updateFijos(model, { type: FijosMsgType.PROCESS_BET_INPUT, inputString: currentInput });
            }

            if (showAmountKeyboard) {
                return updateFijos(model, { type: FijosMsgType.SUBMIT_AMOUNT_INPUT, amountString: currentInput });
            }

            return singleton(model);
        })
        .exhaustive();
};
