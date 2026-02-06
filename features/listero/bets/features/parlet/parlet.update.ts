import { singleton, ret, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { Model } from '../../core/model';
import { ParletMsg, ParletMsgType, PARLET_EDITING_TYPE } from './parlet.types';
import { match } from 'ts-pattern';
import { ParletDomain } from './parlet.domain';
import { ParletState } from './parlet.state';

export function updateParlet(model: Model, msg: ParletMsg): Return<Model, ParletMsg> {
    return match<ParletMsg, Return<Model, ParletMsg>>(msg)
        .with({ type: ParletMsgType.CONFIRM_PARLET_BET }, () => {
            if (!model.parletSession.fromFijosyCorridoBet || model.parletSession.potentialParletNumbers.length < 2) {
                return singleton(model);
            }

            // Create a new parlet bet from the potential numbers
            const newParlet = ParletDomain.create(model.parletSession.potentialParletNumbers);
            const updatedModel = ParletDomain.addToState(model, newParlet);

            return Return.val(
                ParletState.toAmountInput(updatedModel, newParlet.id),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.DELETE_PARLET_BET }, ({ betId }) => {
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

        .with({ type: ParletMsgType.UPDATE_PARLET_BET }, ({ betId, changes }) => {
            const updatedModel = ParletDomain.updateInState(model, betId, changes);

            return Return.val(
                updatedModel,
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.EDIT_PARLET_BET }, ({ betId }) => {
            return Return.val(
                ParletState.setActiveBet(model, betId),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.OPEN_PARLET_AMOUNT_KEYBOARD }, ({ betId }) => {
            const parlet = ParletDomain.findInState(model, betId);

            if (!parlet) {
                return singleton(model);
            }

            return Return.val(
                ParletState.toAmountInput(model, betId, parlet.amount?.toString() || ''),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.CLOSE_AMOUNT_KEYBOARD }, () => {
            return Return.val(
                ParletState.closeKeyboards(model),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.CLOSE_BET_KEYBOARD }, () => {
            return Return.val(
                ParletState.closeKeyboards(model),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.KEY_PRESSED }, ({ key }) => {
            const currentInput = model.editSession.currentInput;
            const newInput = key === 'backspace'
                ? currentInput.slice(0, -1)
                : currentInput + key;

            return Return.val(
                ParletState.updateInput(model, newInput),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.SUBMIT_AMOUNT_INPUT }, ({ amountString }) => {
            const amount = parseFloat(amountString || model.editSession.currentInput) || 0;
            const betId = model.editSession.editingBetId;

            if (!betId || model.editSession.editingAmountType !== PARLET_EDITING_TYPE) {
                return singleton(model);
            }

            // Usar UPDATE_PARLET_BET para actualizar el monto
            return updateParlet(
                ParletState.closeKeyboards(model),
                { type: ParletMsgType.UPDATE_PARLET_BET, betId, changes: { amount } }
            );
        })

        .with({ type: ParletMsgType.CONFIRM_INPUT }, () => {
            if (model.editSession.showBetKeyboard) {
                return updateParlet(
                    model,
                    { type: ParletMsgType.PROCESS_BET_INPUT, inputString: model.editSession.currentInput }
                );
            }
            return updateParlet(
                model,
                { type: ParletMsgType.SUBMIT_AMOUNT_INPUT, amountString: model.editSession.currentInput }
            );
        })

        .with({ type: ParletMsgType.SHOW_PARLET_DRAWER }, ({ visible }) => {
            return Return.val(
                ParletState.setDrawerVisible(model, visible),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.SHOW_PARLET_MODAL }, ({ visible }) => {
            return Return.val(
                ParletState.setModalVisible(model, visible),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.SHOW_PARLET_ALERT }, ({ visible }) => {
            return Return.val(
                ParletState.setAlertVisible(model, visible),
                Cmd.none
            );
        })

        .with({ type: ParletMsgType.PROCESS_BET_INPUT }, ({ inputString }) => {
            // Parse input string into pairs of numbers
            const numbers = ParletDomain.parseInput(inputString);

            if (!ParletDomain.isValid(numbers)) {
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
            const editingBetId = model.editSession.editingBetId;

            if (editingBetId) {
                // Update existing parlet
                // We first clear the edit session (close keyboards), then update the bet
                const clearedModel = ParletState.closeKeyboards(model);
                const updatedModel = ParletDomain.updateInState(clearedModel, editingBetId, { bets: numbers });
                return Return.val(updatedModel, Cmd.none);
            } else {
                // Create new parlet
                const newParlet = ParletDomain.create(numbers);
                const updatedModel = ParletDomain.addToState(model, newParlet);

                // Transition to amount keyboard for the new parlet
                return Return.val(
                    ParletState.toAmountInput(updatedModel, newParlet.id),
                    Cmd.none
                );
            }
        })

        .with({ type: ParletMsgType.PRESS_ADD_PARLET }, ({ fijosCorridosList }) => {
            const numbers = fijosCorridosList.map(bet => bet.bet);

            if (numbers.length < 2) {
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
            return Return.val(
                ParletState.cancelFijosFlow(model),
                Cmd.none
            );
        })

        .otherwise(() => {
            console.warn('Unhandled parlet message type:', msg);
            return singleton(model);
        });
}