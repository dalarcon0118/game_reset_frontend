import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../../../features/listero/bets/core/model';
import { LoteriaMsg, LoteriaMsgType } from './loteria.types';
import { ListData } from '../../../../features/listero/bets/features/bet-list/list.types';
import { Return, singleton, ret } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';

export const updateLoteria = (model: GlobalModel, msg: LoteriaMsg): Return<GlobalModel, LoteriaMsg> => {
    return match<LoteriaMsg, Return<GlobalModel, LoteriaMsg>>(msg)
        .with({ type: LoteriaMsgType.OPEN_BET_KEYBOARD }, () => {
            return singleton({
                ...model,
                loteriaSession: { ...model.loteriaSession, isBetKeyboardVisible: true },
                editSession: { ...model.editSession, currentInput: '' }
            });
        })
        .with({ type: LoteriaMsgType.CLOSE_BET_KEYBOARD }, () => {
            return singleton({
                ...model,
                loteriaSession: { ...model.loteriaSession, isBetKeyboardVisible: false },
                editSession: { ...model.editSession, currentInput: '' }
            });
        })
        .with({ type: LoteriaMsgType.OPEN_AMOUNT_KEYBOARD }, ({ betId }) => {
            return singleton({
                ...model,
                loteriaSession: {
                    ...model.loteriaSession,
                    isAmountKeyboardVisible: true,
                    editingBetId: betId
                },
                editSession: { ...model.editSession, currentInput: '' }
            });
        })
        .with({ type: LoteriaMsgType.CLOSE_AMOUNT_KEYBOARD }, () => {
            return singleton({
                ...model,
                loteriaSession: {
                    ...model.loteriaSession,
                    isAmountKeyboardVisible: false,
                    editingBetId: null
                },
                editSession: { ...model.editSession, currentInput: '' }
            });
        })
        .with({ type: LoteriaMsgType.KEY_PRESSED }, ({ key }) => {
            const currentInput = model.editSession.currentInput;
            let nextInput = currentInput;

            if (key === 'BACKSPACE') {
                nextInput = currentInput.slice(0, -1);
            } else if (key === 'CLEAR') {
                nextInput = '';
            } else {
                // Max length for Loteria is usually 4 (Cuaterna)
                const maxLength = model.loteriaSession.isBetKeyboardVisible ? 4 : 6;
                if (currentInput.length < maxLength) {
                    nextInput = currentInput + key;
                }
            }

            return singleton({
                ...model,
                editSession: { ...model.editSession, currentInput: nextInput }
            });
        })
        .with({ type: LoteriaMsgType.CONFIRM_INPUT }, () => {
            const { currentInput } = model.editSession;

            if (model.loteriaSession.isBetKeyboardVisible) {
                if (currentInput.length === 0) return singleton(model);
                return updateLoteria(model, { type: LoteriaMsgType.PROCESS_BET_INPUT, input: currentInput });
            }

            if (model.loteriaSession.isAmountKeyboardVisible) {
                if (currentInput.length === 0) return singleton(model);
                return updateLoteria(model, { type: LoteriaMsgType.SUBMIT_AMOUNT_INPUT, amount: currentInput });
            }

            return singleton(model);
        })
        .with({ type: LoteriaMsgType.PROCESS_BET_INPUT }, ({ input }) => {
            const betValue = parseInt(input, 10);
            const newBet = {
                id: Math.random().toString(36).substr(2, 9),
                bet: betValue,
                amount: null
            };

            const nextRemoteData = RemoteData.map<any, ListData, ListData>(data => ({
                ...data,
                loteria: [...data.loteria, newBet]
            }), model.listSession.remoteData);

            return ret(
                {
                    ...model,
                    listSession: { ...model.listSession, remoteData: nextRemoteData },
                    loteriaSession: {
                        ...model.loteriaSession,
                        isBetKeyboardVisible: false,
                        isAmountKeyboardVisible: true,
                        editingBetId: newBet.id
                    },
                    editSession: { ...model.editSession, currentInput: '' }
                },
                []
            );
        })
        .with({ type: LoteriaMsgType.SUBMIT_AMOUNT_INPUT }, ({ amount }) => {
            const amountValue = parseInt(amount, 10);
            const betId = model.loteriaSession.editingBetId;

            if (!betId) return singleton(model);

            const nextRemoteData = RemoteData.map<any, ListData, ListData>(data => ({
                ...data,
                loteria: data.loteria.map(bet =>
                    bet.id === betId ? { ...bet, amount: amountValue } : bet
                )
            }), model.listSession.remoteData);

            return singleton({
                ...model,
                listSession: { ...model.listSession, remoteData: nextRemoteData },
                loteriaSession: {
                    ...model.loteriaSession,
                    isAmountKeyboardVisible: false,
                    editingBetId: null
                },
                editSession: { ...model.editSession, currentInput: '' }
            });
        })
        .otherwise(() => singleton(model));
};
