import { match } from 'ts-pattern';
import { Model } from '../../core/model';
import { KeyboardMsgType, KeyboardMsg } from './keyboard.types';
import { Return, singleton } from '@/shared/core/return';

export const updateKeyboard = (model: Model, msg: KeyboardMsg): Return<Model, KeyboardMsg> => {
    return match(msg)
        .with({ type: KeyboardMsgType.OPEN_BET_KEYBOARD }, () => {
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
            });
        })
        .with({ type: KeyboardMsgType.CLOSE_BET_KEYBOARD }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: false,
                },
            });
        })
        .with({ type: KeyboardMsgType.OPEN_AMOUNT_KEYBOARD }, ({ betId, amountType }) => {
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
            });
        })
        .with({ type: KeyboardMsgType.CLOSE_AMOUNT_KEYBOARD }, () => {
            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    showAmountKeyboard: false,
                    editingBetId: null,
                    editingAmountType: null,
                    amountConfirmationDetails: null,
                },
            });
        })
        .otherwise(() => singleton(model));
};
