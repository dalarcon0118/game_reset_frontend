import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { EditMsgType, EditMsg } from './edit.types';
import { Return, singleton } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';

const generateRangeBets = (start: number, end: number, type: 'continuous' | 'terminal'): number[] => {
    const bets: number[] = [];
    if (type === 'continuous') {
        for (let i = start; i <= end; i++) bets.push(i);
    } else if (type === 'terminal') {
        const startLastDigit = start % 10;
        const endLastDigit = end % 10;
        for (let i = start; i <= end; i++) {
            const lastDigit = i % 10;
            if (lastDigit === startLastDigit || lastDigit === endLastDigit) bets.push(i);
        }
    }
    return bets;
};

export const initEdit = (model: GlobalModel): Return<GlobalModel, EditMsg> => {
    return singleton({
        ...model,
        editSession: { ...model.editSession, showRangeDialog: false },
    });
};

export const updateEdit = (model: GlobalModel, msg: EditMsg): Return<GlobalModel, EditMsg> => {
    return match<EditMsg, Return<GlobalModel, EditMsg>>(msg)
        .with({ type: EditMsgType.SET_EDIT_SELECTED_COLUMN }, ({ column }) => {
            return Return.val(
                { ...model, editSession: { ...model.editSession, selectedColumn: column } },
                Cmd.none
            );
        })
        .with({ type: EditMsgType.SET_EDIT_SELECTED_CIRCLE }, ({ circle }) => {
            return Return.val(
                { ...model, editSession: { ...model.editSession, selectedCircle: circle } },
                Cmd.none
            );
        })
        .with({ type: EditMsgType.TOGGLE_RANGE_MODE }, ({ enabled }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        isRangeMode: enabled,
                        rangeType: enabled ? model.editSession.rangeType : null,
                        showRangeDialog: false,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: EditMsgType.SET_RANGE_TYPE }, ({ rangeType }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        rangeType,
                        showRangeDialog: rangeType !== null,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: EditMsgType.GENERATE_RANGE_BETS }, ({ start, end }) => {
            const startNum = parseInt(start, 10);
            const endNum = parseInt(end, 10);
            if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) return singleton(model);
            const rangeBets = generateRangeBets(startNum, endNum, model.editSession.rangeType || 'continuous');
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentNumber: end,
                        rangeBets,
                        showRangeDialog: false,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: EditMsgType.UPDATE_EDIT_INPUT }, ({ value }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentNumber: model.editSession.isRangeMode ? model.editSession.rangeStartNumber : value,
                        currentAmount: model.editSession.isRangeMode ? value : model.editSession.currentAmount,
                        rangeStartNumber: model.editSession.isRangeMode && !model.editSession.rangeStartNumber ? value : model.editSession.rangeStartNumber,
                    },
                },
                Cmd.none
            );
        })
        .exhaustive();
};
