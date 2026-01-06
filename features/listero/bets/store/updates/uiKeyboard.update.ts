import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { UiKeyboardMsgType, UiKeyboardMsg } from '../types/uiKeyboard.types';
import { Cmd } from '@/shared/core/cmd';
import { FijosCorridosBet } from '../types/base.types';
import { AnnotationTypes, GameTypes } from '@/constants/Bet';

type BetAmountType = 'fijo' | 'corrido';

const generateRandomId = () => Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

const splitStringToPairs = (inputString: string): string[] => {
    const pairs: string[] = [];
    for (let i = 0; i < inputString.length - (inputString.length % 2); i += 2) {
        pairs.push(inputString.substring(i, i + 2));
    }
    return pairs;
};

export const updateUiKeyboard = (model: Model, msg: UiKeyboardMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: UiKeyboardMsgType.OPEN_BET_KEYBOARD }, () => {
            return [
                {
                    ...model,
                    showBetKeyboard: true,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    amountConfirmationDetails: null,
                    activeAnnotationType: AnnotationTypes.Bet,
                    activeGameType: GameTypes.FIJOS_CORRIDOS,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiKeyboardMsgType.CLOSE_BET_KEYBOARD }, () => {
            return [
                {
                    ...model,
                    showBetKeyboard: false,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiKeyboardMsgType.OPEN_AMOUNT_KEYBOARD }, ({ betId, amountType }) => {
            return [
                {
                    ...model,
                    editingBetId: betId,
                    editingAmountType: amountType,
                    activeAnnotationType: AnnotationTypes.Amount,
                    activeGameType: GameTypes.FIJOS_CORRIDOS,
                    showAmountKeyboard: true,
                    showBetKeyboard: false,
                    amountConfirmationDetails: null,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiKeyboardMsgType.CLOSE_AMOUNT_KEYBOARD }, () => {
            return [
                {
                    ...model,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    activeAnnotationType: null,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiKeyboardMsgType.PROCESS_BET_INPUT }, ({ inputString }) => {
            if (model.activeAnnotationType !== AnnotationTypes.Bet || model.activeGameType !== GameTypes.FIJOS_CORRIDOS) {
                return [model, Cmd.none] as [Model, Cmd];
            }

            const pairs = splitStringToPairs(inputString);
            const newBets: FijosCorridosBet[] = [];
            const newBetNumbers: number[] = [];

            pairs.forEach((pair) => {
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
                return [
                    {
                        ...model,
                        fijosCorridos: [...model.fijosCorridos, ...newBets],
                        betBuffer: [...model.betBuffer, ...newBetNumbers],
                        showBetKeyboard: false,
                    },
                    Cmd.none,
                ] as [Model, Cmd];
            }

            return [
                {
                    ...model,
                    showBetKeyboard: false,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiKeyboardMsgType.SUBMIT_AMOUNT_INPUT }, ({ amountString }) => {
            const { activeAnnotationType, editingAmountType, editingBetId, betBuffer, fijosCorridos } = model;
            if (activeAnnotationType !== AnnotationTypes.Amount || !editingAmountType || amountString === '') {
                return [
                    {
                        ...model,
                        showAmountKeyboard: false,
                        editingBetId: null,
                        editingAmountType: null,
                        activeAnnotationType: null,
                        amountConfirmationDetails: null,
                    },
                    Cmd.none,
                ] as [Model, Cmd];
            }

            const amountValue = parseInt(amountString, 10);
            if (isNaN(amountValue)) {
                return [
                    {
                        ...model,
                        showAmountKeyboard: false,
                        editingBetId: null,
                        editingAmountType: null,
                        activeAnnotationType: null,
                        amountConfirmationDetails: null,
                    },
                    Cmd.none,
                ] as [Model, Cmd];
            }

            const editingBetObject = fijosCorridos.find(b => b.id === editingBetId);

            if (betBuffer.length > 1 && editingBetId && editingBetObject && betBuffer.includes(editingBetObject.bet)) {
                return [
                    {
                        ...model,
                        amountConfirmationDetails: {
                            amountValue,
                            intendedAmountType: editingAmountType,
                            intendedBetId: editingBetId,
                        },
                        showAmountKeyboard: false,
                    },
                    Cmd.none,
                ] as [Model, Cmd];
            } else {
                return [
                    updateSingleBetAmount(model, editingBetId, editingAmountType, amountValue),
                    Cmd.none,
                ] as [Model, Cmd];
            }
        })
        .with({ type: UiKeyboardMsgType.CONFIRM_APPLY_AMOUNT_ALL }, () => {
            const { amountConfirmationDetails } = model;
            if (!amountConfirmationDetails) return [model, Cmd.none] as [Model, Cmd];

            const updatedModel = updateBufferedBetsAmount(
                model,
                amountConfirmationDetails.intendedAmountType,
                amountConfirmationDetails.amountValue
            );

            return [
                {
                    ...updatedModel,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    activeAnnotationType: null,
                    amountConfirmationDetails: null,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiKeyboardMsgType.CONFIRM_APPLY_AMOUNT_SINGLE }, () => {
            const { amountConfirmationDetails } = model;
            if (!amountConfirmationDetails || !amountConfirmationDetails.intendedBetId) return [model, Cmd.none] as [Model, Cmd];

            const updatedModel = updateSingleBetAmount(
                model,
                amountConfirmationDetails.intendedBetId,
                amountConfirmationDetails.intendedAmountType,
                amountConfirmationDetails.amountValue
            );

            return [
                {
                    ...updatedModel,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    activeAnnotationType: null,
                    amountConfirmationDetails: null,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiKeyboardMsgType.CANCEL_AMOUNT_CONFIRMATION }, () => {
            return [
                {
                    ...model,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    activeAnnotationType: null,
                    amountConfirmationDetails: null,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};

// Helper functions
const updateSingleBetAmount = (
    model: Model,
    betId: string | null,
    amountType: 'fijo' | 'corrido' | 'parlet' | null,
    amount: number
): Model => {
    if (!betId || !amountType) return model;

    // Only handle fijo and corrido in this UI keyboard update
    if (amountType === 'parlet') {
        return {
            ...model,
            showAmountKeyboard: false,
            editingBetId: null,
            editingAmountType: null,
            activeAnnotationType: null,
            amountConfirmationDetails: null,
        };
    }

    return {
        ...model,
        fijosCorridos: model.fijosCorridos.map(bet =>
            bet.id === betId
                ? { ...bet, [amountType === 'fijo' ? 'fijoAmount' : 'corridoAmount']: amount }
                : bet
        ),
        showAmountKeyboard: false,
        editingBetId: null,
        editingAmountType: null,
        activeAnnotationType: null,
        amountConfirmationDetails: null,
    };
};

const updateBufferedBetsAmount = (
    model: Model,
    amountType: 'fijo' | 'corrido' | 'parlet',
    amount: number
): Model => {
    // Only handle fijo and corrido in this UI keyboard update
    if (amountType === 'parlet') {
        return model;
    }

    return {
        ...model,
        fijosCorridos: model.fijosCorridos.map(bet =>
            model.betBuffer.includes(bet.bet)
                ? { ...bet, [amountType === 'fijo' ? 'fijoAmount' : 'corridoAmount']: amount }
                : bet
        ),
    };
};
