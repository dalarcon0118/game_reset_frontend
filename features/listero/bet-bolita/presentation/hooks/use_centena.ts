import { useBolitaDispatch, useBolitaModel } from '../store';
import { CENTENA, CentenaMessages } from '../../domain/models/bolita.messages';
import { useBolitaActions } from './use_bolita_actions';

export const useCentena = () => {
    const model = useBolitaModel();
    const dispatch = useBolitaDispatch();
    const { centena: actions } = useBolitaActions();

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

    const showCentenaDrawer = (visible: boolean) => dispatch(CENTENA(CentenaMessages.SHOW_CENTENA_DRAWER({ visible })));
    const showAmountDrawer = (visible: boolean) => dispatch(CENTENA(CentenaMessages.SHOW_CENTENA_MODAL({ visible })));

    return {
        centenaList,
        editingAmountType,
        isCentenaDrawerVisible,
        isAmountDrawerVisible,
        editCentenaBet: actions.editBet,
        editAmountKeyboard: actions.openAmountKeyboard,
        pressAddCentena: actions.openBetKeyboard,
        showCentenaDrawer,
        showAmountDrawer,
    };
};
