import { match } from 'ts-pattern';
import { BolitaModel } from '../../domain/models/bolita.types';
import { EditMsg, EditMsgType } from '../../domain/models/bolita.messages';
import { Return, singleton } from '@core/tea-utils';

export const updateEdit = (model: BolitaModel, msg: EditMsg): Return<BolitaModel, EditMsg> => {
    return match<EditMsg, Return<BolitaModel, EditMsg>>(msg)
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
        .with({ type: EditMsgType.GENERATE_RANGE_BETS }, () => {
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
