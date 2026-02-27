import { useBolitaStore, selectBolitaModel, selectDispatch } from '../core/store';
import { CENTENA } from '../core/types';
import {
    EDIT_CENTENA_BET,
    OPEN_CENTENA_AMOUNT_KEYBOARD,
    PRESS_ADD_CENTENA,
    SHOW_CENTENA_DRAWER,
    SHOW_CENTENA_MODAL,
    KEY_PRESSED,
    CONFIRM_INPUT
} from './centena.types';

export const useCentena = () => {
    const model = useBolitaStore(selectBolitaModel);
    const dispatch = useBolitaStore(selectDispatch);

    const {
        listState,
        editState,
        centenaSession,
        isEditing,
        entrySession
    } = model;

    const centenaList = isEditing
        ? entrySession.centenas
        : (listState.remoteData.type === 'Success'
            ? listState.remoteData.data.centenas
            : []);

    const {
        editingAmountType,
        currentInput,
        showBetKeyboard,
        showAmountKeyboard,
    } = editState;

    const {
        isCentenaDrawerVisible,
        isAmountDrawerVisible,
    } = centenaSession;

    const editCentenaBet = (betId: string) => dispatch(CENTENA(EDIT_CENTENA_BET({ betId })));
    const editAmountKeyboard = (betId: string) => dispatch(CENTENA(OPEN_CENTENA_AMOUNT_KEYBOARD({ betId })));
    const pressAddCentena = () => dispatch(CENTENA(PRESS_ADD_CENTENA()));
    const showCentenaDrawer = (visible: boolean) => dispatch(CENTENA(SHOW_CENTENA_DRAWER({ visible })));
    const showAmountDrawer = (visible: boolean) => dispatch(CENTENA(SHOW_CENTENA_MODAL({ visible })));
    const handleKeyPress = (key: string) => dispatch(CENTENA(KEY_PRESSED({ key })));
    const handleConfirmInput = () => dispatch(CENTENA(CONFIRM_INPUT()));

    return {
        centenaList,
        editingAmountType,
        currentInput,
        showBetKeyboard,
        showAmountKeyboard,
        isCentenaDrawerVisible,
        isAmountDrawerVisible,
        editCentenaBet,
        editAmountKeyboard,
        pressAddCentena,
        showCentenaDrawer,
        showAmountDrawer,
        handleKeyPress,
        handleConfirmInput,
    };
};
