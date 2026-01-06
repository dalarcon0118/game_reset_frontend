import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { EditMsgType, EditMsg } from '../types/edit.types';
import { Cmd } from '@/shared/core/cmd';

const generateRangeBets = (start: number, end: number, type: 'continuous' | 'terminal'): number[] => {
    const bets: number[] = [];

    if (type === 'continuous') {
        for (let i = start; i <= end; i++) {
            bets.push(i);
        }
    } else if (type === 'terminal') {
        // Terminal range: start, end, and numbers ending with those digits
        const startLastDigit = start % 10;
        const endLastDigit = end % 10;

        for (let i = start; i <= end; i++) {
            const lastDigit = i % 10;
            if (lastDigit === startLastDigit || lastDigit === endLastDigit) {
                bets.push(i);
            }
        }
    }

    return bets;
};

export const updateEdit = (model: Model, msg: EditMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: EditMsgType.SET_EDIT_SELECTED_COLUMN }, ({ column }) => {
            return [
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        selectedColumn: column,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: EditMsgType.SET_EDIT_SELECTED_CIRCLE }, ({ circle }) => {
            return [
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        selectedCircle: circle,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: EditMsgType.TOGGLE_RANGE_MODE }, ({ enabled }) => {
            return [
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        isRangeMode: enabled,
                        // Reset range state when toggling
                        rangeType: enabled ? model.editSession.rangeType : null,
                        showRangeDialog: false,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: EditMsgType.SET_RANGE_TYPE }, ({ rangeType }) => {
            return [
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        rangeType,
                        showRangeDialog: rangeType !== null,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: EditMsgType.GENERATE_RANGE_BETS }, ({ start, end }) => {
            const startNum = parseInt(start, 10);
            const endNum = parseInt(end, 10);

            if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
                return [model, Cmd.none] as [Model, Cmd];
            }

            const rangeBets = generateRangeBets(startNum, endNum, model.editSession.rangeType || 'continuous');

            // For now, just update the edit session. In a full implementation,
            // this would create or modify bets in the fijosCorridos array
            return [
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentNumber: end, // Keep the end number as current
                        showRangeDialog: false,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: EditMsgType.UPDATE_EDIT_INPUT }, ({ value }) => {
            return [
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentNumber: model.editSession.isRangeMode ? model.editSession.rangeStartNumber : value,
                        currentAmount: model.editSession.isRangeMode ? value : model.editSession.currentAmount,
                        rangeStartNumber: model.editSession.isRangeMode && !model.editSession.rangeStartNumber ? value : model.editSession.rangeStartNumber,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};
