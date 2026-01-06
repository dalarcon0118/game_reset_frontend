import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { ParletMsgType, ParletMsg } from '../types/parlet.types';
import { Cmd } from '@/shared/core/cmd';

const generateRandomId = () => Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

const findPotentialParletNumbers = (fijosCorridosList: any[]): number[] => {
    // Get unique bet numbers from fijos/corridos that have amounts
    const numbersWithAmounts = fijosCorridosList
        .filter(bet => bet.fijoAmount !== null || bet.corridoAmount !== null)
        .map(bet => bet.bet);

    return [...new Set(numbersWithAmounts)].sort((a, b) => a - b);
};

export const updateParlet = (model: Model, msg: ParletMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: ParletMsgType.PRESS_ADD_PARLET }, ({ fijosCorridosList }) => {
            const potentialNumbers = findPotentialParletNumbers(fijosCorridosList);

            if (potentialNumbers.length < 2) {
                // Not enough numbers for a parlet
                return [model, Cmd.none] as [Model, Cmd];
            }

            return [
                {
                    ...model,
                    potentialParletNumbers: potentialNumbers,
                    fromFijosyCorridoBet: true,
                    parletAlertVisibleState: true,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.CONFIRM_PARLET_BET }, () => {
            if (!model.fromFijosyCorridoBet || model.potentialParletNumbers.length < 2) {
                return [model, Cmd.none] as [Model, Cmd];
            }

            // Create a new parlet bet from the potential numbers
            const newParlet: any = {
                id: generateRandomId(),
                bets: model.potentialParletNumbers,
                amount: null, // Will be set later
            };

            return [
                {
                    ...model,
                    parlets: [...model.parlets, newParlet],
                    potentialParletNumbers: [],
                    fromFijosyCorridoBet: false,
                    parletAlertVisibleState: false,
                    activeParletBetId: newParlet.id,
                    isParletDrawerVisible: true,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.CANCEL_PARLET_BET }, () => {
            return [
                {
                    ...model,
                    potentialParletNumbers: [],
                    fromFijosyCorridoBet: false,
                    parletAlertVisibleState: false,
                    canceledFromFijosyCorridoBet: true,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.EDIT_PARLET_BET }, ({ betId }) => {
            return [
                {
                    ...model,
                    activeParletBetId: betId,
                    isParletDrawerVisible: true,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.DELETE_PARLET_BET }, ({ betId }) => {
            return [
                {
                    ...model,
                    parlets: model.parlets.filter(parlet => parlet.id !== betId),
                    activeParletBetId: model.activeParletBetId === betId ? null : model.activeParletBetId,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.UPDATE_PARLET_BET }, ({ betId, changes }) => {
            return [
                {
                    ...model,
                    parlets: model.parlets.map(parlet =>
                        parlet.id === betId ? { ...parlet, ...changes } : parlet
                    ),
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.OPEN_PARLET_AMOUNT_KEYBOARD }, ({ betId }) => {
            return [
                {
                    ...model,
                    activeParletBetId: betId,
                    editingAmountType: 'parlet',
                    isAmmountDrawerVisible: true,
                    showParletKeyboard: false,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.SHOW_PARLET_DRAWER }, ({ visible }) => {
            return [
                {
                    ...model,
                    isParletDrawerVisible: visible,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.SHOW_PARLET_MODAL }, ({ visible }) => {
            return [
                {
                    ...model,
                    isParletModalVisible: visible,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ParletMsgType.SHOW_PARLET_ALERT }, ({ visible }) => {
            return [
                {
                    ...model,
                    parletAlertVisibleState: visible,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};
