import { match } from 'ts-pattern';
import { Model } from '../../core/model';
import { UiMsgType, UiMsg } from './ui.types';
import { Return, singleton } from '@/shared/core/return';

export const updateUi = (model: Model, msg: UiMsg): Return<Model, UiMsg> => {
    return match<UiMsg, Return<Model, UiMsg>>(msg)
        .with({ type: UiMsgType.SET_ACTIVE_ANNOTATION_TYPE }, ({ annotationType }) => {
            return singleton({
                ...model,
                parletSession: {
                    ...model.parletSession,
                    activeAnnotationType: annotationType,
                },
            });
        })
        .with({ type: UiMsgType.SET_ACTIVE_GAME_TYPE }, ({ gameType }) => {
            return singleton({
                ...model,
                parletSession: {
                    ...model.parletSession,
                    activeGameType: gameType,
                },
            });
        })
        .with({ type: UiMsgType.CLEAR_ERROR }, () => {
            return singleton({
                ...model,
                error: null,
            });
        })
        .with({ type: UiMsgType.CLOSE_ALL_DRAWERS }, () => {
            return singleton({
                ...model,
                parletSession: {
                    ...model.parletSession,
                    isParletDrawerVisible: false,
                    isParletModalVisible: false,
                    isAmountDrawerVisible: false,
                },
                editSession: {
                    ...model.editSession,
                    showBetKeyboard: false,
                    showAmountKeyboard: false,
                    showParletKeyboard: false,
                    showRangeDialog: false,
                },
            });
        })
        .otherwise(() => singleton(model));
};
