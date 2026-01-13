import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { ParletMsgType, ParletMsg } from './parlet.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, singleton } from '@/shared/core/return';
import { generateRandomId, splitStringToPairs } from '../../shared/utils/numbers';
import { ParletBet } from '@/types';
import { RemoteData } from '@/shared/core/remote.data';
import { ListData } from '../bet-list/list.types';

// Initial state for this submodule
export const initParlet = (model: GlobalModel): Return<GlobalModel, ParletMsg> => {
    return singleton({
        ...model,
        parletSession: {
            ...model.parletSession,
            parletAlertVisibleState: false,
        },
    });
};

const findPotentialParletNumbers = (fijosCorridosList: any[]): number[] => {
    // Get unique bet numbers from fijos/corridos that have amounts
    const numbersWithAmounts = fijosCorridosList
        .filter(bet => bet.fijoAmount !== null || bet.corridoAmount !== null)
        .map(bet => bet.bet);

    return [...new Set(numbersWithAmounts)].sort((a, b) => a - b);
};

export const updateParlet = (model: GlobalModel, msg: ParletMsg): Return<GlobalModel, ParletMsg> => {
    return match<ParletMsg, Return<GlobalModel, ParletMsg>>(msg)
        .with({ type: ParletMsgType.PRESS_ADD_PARLET }, ({ fijosCorridosList }) => {
            const potentialNumbers = findPotentialParletNumbers(fijosCorridosList);

            if (potentialNumbers.length < 2) {
                // Just open the drawer without creating a bet yet
                return Return.val(
                    {
                        ...model,
                        editSession: {
                            ...model.editSession,
                            currentInput: '',
                        },
                        parletSession: {
                            ...model.parletSession,
                            activeParletBetId: null, // null means we are creating a new one
                            isParletDrawerVisible: true,
                        },
                    },
                    Cmd.none
                );
            }

            return Return.val(
                {
                    ...model,
                    parletSession: {
                        ...model.parletSession,
                        potentialParletNumbers: potentialNumbers,
                        fromFijosyCorridoBet: true,
                        parletAlertVisibleState: true,
                    },
                },
                Cmd.alert({
                    title: "¿Desea Agregar estos números como parlet?",
                    message: `Lista de números [${potentialNumbers.join(', ')}] como parlet?`,
                    buttons: [
                        { text: "Cancel", onPressMsg: { type: ParletMsgType.CANCEL_PARLET_BET }, style: "cancel" },
                        { text: "OK", onPressMsg: { type: ParletMsgType.CONFIRM_PARLET_BET } }
                    ]
                })
            );
        })
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

            const nextRemoteData = RemoteData.map((data: ListData) => ({
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
                        currentInput: '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        potentialParletNumbers: [],
                        fromFijosyCorridoBet: false,
                        parletAlertVisibleState: false,
                        activeParletBetId: newParlet.id,
                        isAmountDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.CANCEL_PARLET_BET }, () => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        potentialParletNumbers: [],
                        fromFijosyCorridoBet: false,
                        parletAlertVisibleState: false,
                        canceledFromFijosyCorridoBet: true,
                        activeParletBetId: null,
                        isParletDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.EDIT_PARLET_BET }, ({ betId }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        activeParletBetId: betId,
                        isParletDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.DELETE_PARLET_BET }, ({ betId }) => {
            const nextRemoteData = RemoteData.map((data: ListData) => ({
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
                        activeParletBetId: model.parletSession.activeParletBetId === betId ? null : model.parletSession.activeParletBetId,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.UPDATE_PARLET_BET }, ({ betId, changes }) => {
            const nextRemoteData = RemoteData.map((data: ListData) => ({
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
        })
        .with({ type: ParletMsgType.OPEN_PARLET_AMOUNT_KEYBOARD }, ({ betId }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        editingAmountType: 'parlet',
                        showParletKeyboard: false,
                        currentInput: '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        activeParletBetId: betId,
                        isAmountDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.SHOW_PARLET_DRAWER }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: visible ? model.editSession.currentInput : '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        isParletDrawerVisible: visible,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.SHOW_PARLET_MODAL }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: visible ? model.editSession.currentInput : '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        isAmountDrawerVisible: visible,
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
        .with({ type: ParletMsgType.KEY_PRESSED }, ({ key }) => {
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
        .with({ type: ParletMsgType.CONFIRM_INPUT }, () => {
            const { currentInput, showAmountKeyboard } = model.editSession;
            const { isParletDrawerVisible } = model.parletSession;

            if (isParletDrawerVisible) {
                return updateParlet(model, { type: ParletMsgType.PROCESS_BET_INPUT, inputString: currentInput });
            }

            if (showAmountKeyboard || model.parletSession.isAmountDrawerVisible) {
                return updateParlet(model, { type: ParletMsgType.SUBMIT_AMOUNT_INPUT, amountString: currentInput });
            }

            return singleton(model);
        })
        .with({ type: ParletMsgType.PROCESS_BET_INPUT }, ({ inputString }) => {
            const { activeParletBetId } = model.parletSession;

            const pairs = splitStringToPairs(inputString);
            const numbers = pairs.map(p => parseInt(p, 10)).filter(n => !isNaN(n));

            // If no valid numbers, just close and do nothing
            if (numbers.length === 0) {
                return Return.val(
                    {
                        ...model,
                        editSession: {
                            ...model.editSession,
                            currentInput: '',
                        },
                        parletSession: {
                            ...model.parletSession,
                            isParletDrawerVisible: false,
                            activeParletBetId: null,
                        }
                    },
                    Cmd.none
                );
            }

            // If activeParletBetId is null, it's a new bet
            if (!activeParletBetId) {
                const newParlet: ParletBet = {
                    id: generateRandomId(),
                    bets: numbers,
                    amount: 0,
                };

                const nextRemoteData = RemoteData.map((data: ListData) => ({
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
                            currentInput: '',
                        },
                        parletSession: {
                            ...model.parletSession,
                            isParletDrawerVisible: false,
                            activeParletBetId: null,
                        }
                    },
                    Cmd.none
                );
            }

            // Otherwise, update existing bet
            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                parlets: data.parlets.map((p: ParletBet) =>
                    p.id === activeParletBetId ? { ...p, bets: numbers } : p
                ),
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
                        currentInput: '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        isParletDrawerVisible: false,
                    }
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.SUBMIT_AMOUNT_INPUT }, ({ amountString }) => {
            const { activeParletBetId } = model.parletSession;
            if (!activeParletBetId) return singleton(model);

            const amount = parseInt(amountString, 10);
            if (isNaN(amount)) return singleton(model);

            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                parlets: data.parlets.map((p: ParletBet) =>
                    p.id === activeParletBetId ? { ...p, amount } : p
                ),
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
                        currentInput: '',
                    },
                    parletSession: {
                        ...model.parletSession,
                        isAmountDrawerVisible: false,
                    }
                },
                Cmd.none
            );
        })
        .exhaustive();
};
