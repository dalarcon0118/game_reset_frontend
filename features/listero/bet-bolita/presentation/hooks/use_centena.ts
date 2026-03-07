import { useBolitaStore, selectBolitaModel, selectDispatch } from '../store';
import { CENTENA, KEY_PRESSED, CentenaMessages } from '../../domain/models/bolita.messages';

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

    const editCentenaBet = (betId: string) => dispatch(CENTENA(CentenaMessages.EDIT_CENTENA_BET({ betId })));
    const editAmountKeyboard = (betId: string) => dispatch(CENTENA(CentenaMessages.OPEN_CENTENA_AMOUNT_KEYBOARD({ betId })));
    const pressAddCentena = () => dispatch(CENTENA(CentenaMessages.PRESS_ADD_CENTENA()));
    const showCentenaDrawer = (visible: boolean) => dispatch(CENTENA(CentenaMessages.SHOW_CENTENA_DRAWER({ visible })));
    const showAmountDrawer = (visible: boolean) => dispatch(CENTENA(CentenaMessages.SHOW_CENTENA_MODAL({ visible })));

    return {
        centenaList,
        editingAmountType,
        isCentenaDrawerVisible,
        isAmountDrawerVisible,
        editCentenaBet,
        editAmountKeyboard,
        pressAddCentena,
        showCentenaDrawer,
        showAmountDrawer,
    };
};
