import { singleton, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { BolitaModel as Model } from '../core/model';
import * as Msg from './parlet.types';
import { PARLET_EDITING_TYPE, ParletMsg } from './parlet.types';
import { match } from 'ts-pattern';
import { ParletDomain } from './parlet.domain';
import { ParletState } from './parlet.state';
import { logger } from '@/shared/utils/logger';
import { FijosCorridosBet } from '@/types';

const log = logger.withTag('PARLET_UPDATE');

const getCombinationKey = (numbers: number[]): string => {
    return [...numbers].sort((a, b) => a - b).join('-');
};

export function updateParlet(model: Model, msg: ParletMsg): Return<Model, ParletMsg> {
    return match<ParletMsg, Return<Model, ParletMsg>>(msg)
        .with(Msg.CONFIRM_PARLET_BET.type(), () => {
            if (model.parletSession.potentialParletNumbers.length < 2) {
                log.debug('Skipping CONFIRM_PARLET_BET: invalid potential numbers');
                return singleton(model);
            }

            // Expand potential numbers into all possible pairs
            const combinations = ParletDomain.generateCombinations(model.parletSession.potentialParletNumbers);
            log.debug('Expanding potential numbers into combinations', {
                original: model.parletSession.potentialParletNumbers,
                combinations
            });

            // Create new parlet bets from all combinations
            const newParlets = combinations.map(nums => ParletDomain.create(nums));
            const updatedModel = ParletDomain.addManyToState(model, newParlets);

            const firstBetId = newParlets[0].id;
            const allIds = newParlets.map(p => p.id);

            return Return.val(
                ParletState.toAmountInput(updatedModel, firstBetId, '', allIds),
                Cmd.none
            );
        })

        .with(Msg.DELETE_PARLET_BET.type(), ({ betId }) => {
            log.debug('Deleting parlet bet', { betId });
            const updatedModel = ParletDomain.deleteFromState(model, betId);

            return Return.val(
                {
                    ...updatedModel,
                    parletSession: {
                        ...updatedModel.parletSession,
                        activeParletBetId: null
                    }
                },
                Cmd.none
            );
        })

        .with(Msg.UPDATE_PARLET_BET.type(), ({ betId, changes }) => {
            log.debug('Updating parlet bet', { betId, changes });
            const updatedModel = ParletDomain.updateInState(model, betId, changes);

            return Return.val(
                updatedModel,
                Cmd.none
            );
        })

        .with(Msg.EDIT_PARLET_BET.type(), ({ betId }) => {
            return Return.val(
                ParletState.setActiveBet(model, betId),
                Cmd.none
            );
        })

        .with(Msg.OPEN_PARLET_AMOUNT_KEYBOARD.type(), ({ betId }) => {
            const parlet = ParletDomain.findInState(model, betId);

            if (!parlet) {
                return singleton(model);
            }

            return Return.val(
                ParletState.toAmountInput(model, betId, parlet.amount?.toString() || ''),
                Cmd.none
            );
        })

        .with(Msg.CLOSE_AMOUNT_KEYBOARD.type(), () => {
            return Return.val(
                ParletState.closeKeyboards(model),
                Cmd.none
            );
        })

        .with(Msg.CLOSE_BET_KEYBOARD.type(), () => {
            return Return.val(
                ParletState.closeKeyboards(model),
                Cmd.none
            );
        })

        .with(Msg.KEY_PRESSED.type(), ({ key }) => {
            const currentInput = model.editState.currentInput;
            const newInput = key === 'backspace'
                ? currentInput.slice(0, -1)
                : currentInput + key;

            return Return.val(
                ParletState.updateInput(model, newInput),
                Cmd.none
            );
        })

        .with(Msg.SUBMIT_AMOUNT_INPUT.type(), ({ amountString }) => {
            const amount = parseFloat(amountString || model.editState.currentInput) || 0;
            const betId = model.editState.editingBetId;
            const bulkIds = model.parletSession.bulkEditingBetIds;

            if (!betId || model.editState.editingAmountType !== PARLET_EDITING_TYPE) {
                return singleton(model);
            }

            // If we have bulk IDs, update all of them
            if (bulkIds && bulkIds.length > 0) {
                log.debug('Updating bulk parlet bets amount', { bulkIds, amount });
                const updatedModel = ParletDomain.updateManyInState(
                    ParletState.closeKeyboards(model),
                    bulkIds,
                    { amount }
                );
                return singleton(updatedModel);
            }

            // Usar UPDATE_PARLET_BET para actualizar el monto de una sola apuesta
            return updateParlet(
                ParletState.closeKeyboards(model),
                Msg.UPDATE_PARLET_BET({ betId, changes: { amount } })
            );
        })

        .with(Msg.CONFIRM_INPUT.type(), () => {
            if (model.editState.showBetKeyboard) {
                return updateParlet(
                    model,
                    Msg.PROCESS_BET_INPUT({ inputString: model.editState.currentInput })
                );
            }
            return updateParlet(
                model,
                Msg.SUBMIT_AMOUNT_INPUT({ amountString: model.editState.currentInput })
            );
        })

        .with(Msg.SHOW_PARLET_DRAWER.type(), ({ visible }) => {
            return Return.val(
                ParletState.setDrawerVisible(model, visible),
                Cmd.none
            );
        })

        .with(Msg.SHOW_PARLET_MODAL.type(), ({ visible }) => {
            return Return.val(
                ParletState.setModalVisible(model, visible),
                Cmd.none
            );
        })

        .with(Msg.SHOW_PARLET_ALERT.type(), ({ visible }) => {
            return Return.val(
                ParletState.setAlertVisible(model, visible),
                Cmd.none
            );
        })

        .with(Msg.PROCESS_BET_INPUT.type(), ({ inputString }) => {
            log.debug('Processing parlet bet input', { inputString });
            // Parse input string into pairs of numbers
            const numbers = ParletDomain.parseInput(inputString);

            if (!ParletDomain.isValid(numbers)) {
                log.debug('Invalid parlet numbers', { numbers });
                return Return.val(
                    model,
                    Cmd.alert({
                        title: 'Parlet Inválido',
                        message: 'Un parlet debe tener al menos 2 números.',
                        buttons: [{ text: 'OK', style: 'cancel' }]
                    })
                );
            }

            // Check if we are editing an existing bet
            const editingBetId = model.editState.editingBetId;

            if (editingBetId) {
                log.debug('Updating existing parlet from input', { editingBetId, numbers });
                // Update existing parlet (only if it's a single update, not expansion during edit)
                const clearedModel = ParletState.closeKeyboards(model);
                const updatedModel = ParletDomain.updateInState(clearedModel, editingBetId, { bets: numbers });
                return Return.val(updatedModel, Cmd.none);
            } else {
                // Create new parlets (expand if more than 2 numbers)
                const combinations = ParletDomain.generateCombinations(numbers);

                if (combinations.length > 1) {
                    log.debug('Expanding manual input into combinations', { numbers, combinations });
                    const newParlets = combinations.map(nums => ParletDomain.create(nums));
                    const updatedModel = ParletDomain.addManyToState(model, newParlets);

                    const firstBetId = newParlets[0].id;
                    const allIds = newParlets.map(p => p.id);

                    return Return.val(
                        ParletState.toAmountInput(updatedModel, firstBetId, '', allIds),
                        Cmd.none
                    );
                } else {
                    // Just one parlet
                    const newParlet = ParletDomain.create(numbers);
                    log.debug('Creating single new parlet from input', { numbers, parletId: newParlet.id });
                    const updatedModel = ParletDomain.addToState(model, newParlet);

                    return Return.val(
                        ParletState.toAmountInput(updatedModel, newParlet.id),
                        Cmd.none
                    );
                }
            }
        })

        .with(Msg.PRESS_ADD_PARLET.type(), ({ fijosCorridosList }) => {
            const numbers = fijosCorridosList.map((bet: FijosCorridosBet) => bet.bet);

            if (numbers.length < 2) {
                return Return.val(
                    ParletState.toBetInput(model),
                    Cmd.none
                );
            }

            const combinationKey = getCombinationKey(numbers);
            if (model.parletSession.usedFijosCombinations.includes(combinationKey)) {
                return Return.val(
                    ParletState.toBetInput(model),
                    Cmd.none
                );
            }

            return Return.val(
                ParletState.setPotentialNumbers(model, numbers),
                Cmd.alert({
                    title: 'Crear Parlet',
                    message: `¿Deseas crear un parlet con los números: ${numbers.join(', ')}?`,
                    buttons: [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                            onPressMsg: Msg.CANCEL_PARLET_BET()
                        },
                        {
                            text: 'Crear',
                            onPressMsg: Msg.CONFIRM_PARLET_BET()
                        }
                    ]
                })
            );
        })

        .with(Msg.CANCEL_PARLET_BET.type(), () => {
            return Return.val(
                ParletState.cancelFijosFlow(model),
                Cmd.none
            );
        })

        .otherwise(() => {
            log.warn('Unhandled parlet message type:', msg);
            return singleton(model);
        });
}