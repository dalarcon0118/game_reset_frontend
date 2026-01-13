import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { ParletMsgType, ParletMsg } from './parlet.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, singleton } from '@/shared/core/return';
import { generateRandomId } from '../../shared/utils/numbers';
import { ParletBet } from '@/types';

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
                // Not enough numbers for a parlet
                return singleton(model);
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
                Cmd.none
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

            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
                        parlets: [...model.listSession.parlets, newParlet],
                    },
                    parletSession: {
                        ...model.parletSession,
                        potentialParletNumbers: [],
                        fromFijosyCorridoBet: false,
                        parletAlertVisibleState: false,
                        activeParletBetId: newParlet.id,
                        isParletDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.CANCEL_PARLET_BET }, () => {
            return Return.val(
                {
                    ...model,
                    parletSession: {
                        ...model.parletSession,
                        potentialParletNumbers: [],
                        fromFijosyCorridoBet: false,
                        parletAlertVisibleState: false,
                        canceledFromFijosyCorridoBet: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.EDIT_PARLET_BET }, ({ betId }) => {
            return Return.val(
                {
                    ...model,
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
            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
                        parlets: model.listSession.parlets.filter(parlet => parlet.id !== betId),
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
            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
                        parlets: model.listSession.parlets.map(parlet =>
                            parlet.id === betId ? { ...parlet, ...changes } : parlet
                        ),
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
                    },
                    parletSession: {
                        ...model.parletSession,
                        activeParletBetId: betId,
                        isAmmountDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: ParletMsgType.SHOW_PARLET_DRAWER }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
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
                    parletSession: {
                        ...model.parletSession,
                        isParletModalVisible: visible,
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
        .exhaustive();
};
