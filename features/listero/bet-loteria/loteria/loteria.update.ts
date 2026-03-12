import { match } from 'ts-pattern';
import { LoteriaMsg, LoteriaState } from './loteria.types';
import * as Msg from './loteria.types';
import { Return, singleton } from '@core/tea-utils';

/**
 * Pure update function for Loteria component.
 * Handles only LoteriaState (UI state).
 * Business logic and shared state updates are handled by the parent Feature Update.
 */
export const updateLoteria = (msg: LoteriaMsg, model: LoteriaState): Return<LoteriaState, LoteriaMsg> => {
    return match<LoteriaMsg, Return<LoteriaState, LoteriaMsg>>(msg)
        .with({ type: 'OPEN_BET_KEYBOARD' }, () => {
            return singleton({
                ...model,
                isBetKeyboardVisible: true,
                isAmountKeyboardVisible: false,
                editingBetId: null
            });
        })
        .with({ type: 'CLOSE_BET_KEYBOARD' }, () => {
            return singleton({
                ...model,
                isBetKeyboardVisible: false
            });
        })
        .with({ type: 'OPEN_AMOUNT_KEYBOARD' }, (m) => {
            return singleton({
                ...model,
                isAmountKeyboardVisible: true,
                isBetKeyboardVisible: false,
                editingBetId: m.payload.betId
            });
        })
        .with({ type: 'CLOSE_AMOUNT_KEYBOARD' }, () => {
            return singleton({
                ...model,
                isAmountKeyboardVisible: false,
                editingBetId: null
            });
        })
        .with({ type: 'KEY_PRESSED' }, () => singleton(model))
        .with({ type: 'CONFIRM_INPUT' }, () => singleton(model))
        .with({ type: 'PROCESS_BET_INPUT' }, () => singleton(model))
        .with({ type: 'SUBMIT_AMOUNT_INPUT' }, () => {
            return singleton({
                ...model,
                isAmountKeyboardVisible: false,
                editingBetId: null
            });
        })
        .with({ type: 'EDIT_LOTERIA_BET' }, (m) => {
            return singleton({
                ...model,
                isBetKeyboardVisible: true,
                isAmountKeyboardVisible: false,
                editingBetId: m.payload.betId
            });
        })
        .with({ type: 'REQUEST_SAVE' }, () => singleton(model))
        .with({ type: 'CONFIRM_SAVE_BETS' }, () => singleton(model))
        .with({ type: 'SAVE_BETS_RESPONSE' }, () => singleton(model))
        .with({ type: 'SAVE_SUCCESS' }, () => singleton(model))
        .with({ type: 'SAVE_FAILURE' }, () => singleton(model))
        .with({ type: 'INIT' }, () => singleton(model))
        .with({ type: 'REFRESH_BETS' }, () => singleton(model))
        .exhaustive();
};
