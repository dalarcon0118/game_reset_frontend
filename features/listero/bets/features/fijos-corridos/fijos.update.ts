import { match } from 'ts-pattern';
import { Model } from '../../core/model';
import { FijosMsg, FijosMsgType } from './fijos.types';
import { Cmd } from '@/shared/core/cmd';
import { FijosCorridosBet } from '@/types';
import { Return, singleton } from '@/shared/core/return';
import { AnnotationTypes, GameTypes } from '@/constants/Bet';
import { splitStringToPairs, generateRandomId } from '../../shared/utils/numbers';

type BetAmountType = 'fijo' | 'corrido';

const updateSingleBetAmount = (model: Model, betId: string, type: BetAmountType, amount: number): Model => {
    return {
        ...model,
        listSession: {
            ...model.listSession,
            fijosCorridos: model.listSession.fijosCorridos.map(b =>
                b.id === betId
                    ? { ...b, [type === 'fijo' ? 'fijoAmount' : 'corridoAmount']: amount }
                    : b
            )
        }
    };
};

const updateBufferedBetsAmount = (model: Model, type: BetAmountType, amount: number): Model => {
    const { editSession, listSession } = model;
    const { betBuffer } = editSession;
    const { fijosCorridos } = listSession;

    return {
        ...model,
        listSession: {
            ...listSession,
            fijosCorridos: fijosCorridos.map(b =>
                betBuffer.includes(b.bet)
                    ? { ...b, [type === 'fijo' ? 'fijoAmount' : 'corridoAmount']: amount }
                    : b
            ),
        },
        editSession: {
            ...editSession,
            betBuffer: [] // Clear buffer after applying
        }
    };
};

export const updateFijos = (model: Model, msg: FijosMsg): Return<Model, FijosMsg> => {
    return match<FijosMsg, Return<Model, FijosMsg>>(msg)
        .with({ type: FijosMsgType.OPEN_BET_KEYBOARD }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: true,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    amountConfirmationDetails: null,
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
                    amountConfirmationDetails: null,
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
                return singleton({
                    ...model,
                    listSession: {
                        ...model.listSession,
                        fijosCorridos: [...model.listSession.fijosCorridos, ...newBets],
                    },
                    editSession: {
                        ...model.editSession,
                        betBuffer: [...model.editSession.betBuffer, ...newBetNumbers],
                        showBetKeyboard: false,
                    },
                });
            }

            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: false,
                },
            });
        })
        .with({ type: FijosMsgType.SUBMIT_AMOUNT_INPUT }, ({ amountString }) => {
            const { parletSession, editSession, listSession } = model;
            const { activeAnnotationType } = parletSession;
            const { editingAmountType, editingBetId, betBuffer } = editSession;
            const { fijosCorridos } = listSession;

            if (activeAnnotationType !== AnnotationTypes.Amount || !editingAmountType || amountString === '') {
                return singleton({
                    ...model,
                    editSession: {
                        ...editSession,
                        showAmountKeyboard: false,
                        editingBetId: null,
                        editingAmountType: null,
                        amountConfirmationDetails: null,
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
                    },
                    parletSession: {
                        ...parletSession,
                        activeAnnotationType: null,
                    },
                });
            }

            const editingBetObject = fijosCorridos.find(b => b.id === editingBetId);

            if (betBuffer.length > 1 && editingBetId && editingBetObject && betBuffer.includes(editingBetObject.bet)) {
                return singleton({
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
                });
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
        .exhaustive();
};
