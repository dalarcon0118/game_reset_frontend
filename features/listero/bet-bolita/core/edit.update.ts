import { match } from 'ts-pattern';
import { EditMsg, EditMsgType } from './edit.types';
import { BolitaModel } from './model';
import { Return, singleton } from '@/shared/core/return';

export const updateEdit = (model: BolitaModel, msg: EditMsg): Return<BolitaModel, EditMsg> => {
    return match(msg)
        .with({ type: EditMsgType.SET_EDIT_SELECTED_COLUMN }, ({ column }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    selectedColumn: column
                }
            });
        })
        .with({ type: EditMsgType.SET_EDIT_SELECTED_CIRCLE }, ({ circle }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    selectedCircle: circle
                }
            });
        })
        .with({ type: EditMsgType.TOGGLE_RANGE_MODE }, ({ enabled }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    isRangeMode: enabled
                }
            });
        })
        .with({ type: EditMsgType.SET_RANGE_TYPE }, ({ rangeType }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    rangeType
                }
            });
        })
        .with({ type: EditMsgType.GENERATE_RANGE_BETS }, ({ start, end }) => {
            // Logic for generating range bets would go here
            // For now just a placeholder
            return singleton(model);
        })
        .with({ type: EditMsgType.UPDATE_EDIT_INPUT }, ({ value }) => {
            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    currentInput: value
                }
            });
        })
        .exhaustive();
};
