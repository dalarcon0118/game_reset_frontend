import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { UiMsgType, UiMsg } from '../types/ui.types';
import { Cmd } from '@/shared/core/cmd';

export const updateUi = (model: Model, msg: UiMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: UiMsgType.SET_ACTIVE_ANNOTATION_TYPE }, ({ annotationType }) => {
            return [
                {
                    ...model,
                    activeAnnotationType: annotationType,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiMsgType.SET_ACTIVE_GAME_TYPE }, ({ gameType }) => {
            return [
                {
                    ...model,
                    activeGameType: gameType,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiMsgType.CLEAR_ERROR }, () => {
            return [
                {
                    ...model,
                    error: null,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: UiMsgType.CLOSE_ALL_DRAWERS }, () => {
            return [
                {
                    ...model,
                    showBetKeyboard: false,
                    showAmountKeyboard: false,
                    showParletKeyboard: false,
                    isParletDrawerVisible: false,
                    isParletModalVisible: false,
                    isAmmountDrawerVisible: false,
                    editSession: {
                        ...model.editSession,
                        showRangeDialog: false,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};
