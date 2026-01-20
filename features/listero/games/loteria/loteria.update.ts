import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../../../features/listero/bets/core/model';
import { LoteriaMsg, LoteriaMsgType } from './loteria.types';
import { ListData } from '../../../../features/listero/bets/features/bet-list/list.types';
import { Return, singleton, ret } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { getFixedAmountFromRules, filterRulesByBetType } from '@/shared/utils/validation';

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
            const normalizedKey = key.toUpperCase();

            if (normalizedKey === 'BACKSPACE') {
                nextInput = currentInput.slice(0, -1);
            } else if (normalizedKey === 'CLEAR') {
                nextInput = '';
            } else {
                // Max length for Loteria is 5 for (X)-(XX)-(XX) format
                const maxLength = model.loteriaSession.isBetKeyboardVisible ? 5 : 6;
                if (currentInput.length < maxLength && /^\d+$/.test(key)) {
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

            // Check for fixed amount rules
            const loteriaBetTypeId = model.managementSession.betTypes.loteria;
            const validationRules = model.rules.data?.validation_rules || [];

            console.log('[loteria.update] Processing bet input. loteriaBetTypeId:', loteriaBetTypeId);

            const betTypeRules = loteriaBetTypeId
                ? filterRulesByBetType(validationRules, loteriaBetTypeId)
                : validationRules.filter(r => {
                    const name = (r.name || '').toUpperCase();
                    return name.includes('LOTERIA') ||
                        name.includes('LOTERÍA') ||
                        name.includes('CUATERNA');
                });

            const fixedAmount = getFixedAmountFromRules(betTypeRules);
            console.log('[loteria.update] Detected fixedAmount:', fixedAmount);

            const newBet = {
                id: Math.random().toString(36).substr(2, 9),
                bet: betValue,
                amount: fixedAmount || 0 // Use fixed amount if found, else 0 for user to input
            };

            const nextRemoteData = RemoteData.map<any, ListData, ListData>(data => ({
                ...data,
                loteria: [...data.loteria, newBet]
            }), model.listSession.remoteData);

            // If we have a fixed amount, we don't need to show the amount keyboard
            const shouldShowAmountKeyboard = fixedAmount === null;

            return ret(
                {
                    ...model,
                    listSession: { ...model.listSession, remoteData: nextRemoteData },
                    loteriaSession: {
                        ...model.loteriaSession,
                        isBetKeyboardVisible: false,
                        isAmountKeyboardVisible: shouldShowAmountKeyboard,
                        editingBetId: shouldShowAmountKeyboard ? newBet.id : null
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
