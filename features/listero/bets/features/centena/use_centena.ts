import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { CentenaMsgType } from './centena.types';

export const useCentena = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const {
        listSession,
        editSession,
        centenaSession,
    } = model;

    const centenaList =
        listSession.remoteData.type === 'Success'
            ? listSession.remoteData.data.centenas
            : [];

    const {
        editingAmountType,
        currentInput,
    } = editSession;

    const {
        isCentenaDrawerVisible,
        isAmountDrawerVisible,
    } = centenaSession;

    const editCentenaBet = (betId: string) => dispatch({ type: 'CENTENA', payload: { type: CentenaMsgType.EDIT_CENTENA_BET, betId } });
    const editAmountKeyboard = (betId: string) => dispatch({ type: 'CENTENA', payload: { type: CentenaMsgType.OPEN_CENTENA_AMOUNT_KEYBOARD, betId } });
    const pressAddCentena = () => dispatch({ type: 'CENTENA', payload: { type: CentenaMsgType.PRESS_ADD_CENTENA } });
    const showCentenaDrawer = (visible: boolean) => dispatch({ type: 'CENTENA', payload: { type: CentenaMsgType.SHOW_CENTENA_DRAWER, visible } });
    const showAmountDrawer = (visible: boolean) => dispatch({ type: 'CENTENA', payload: { type: CentenaMsgType.SHOW_CENTENA_MODAL, visible } });
    const handleKeyPress = (key: string) => dispatch({ type: 'CENTENA', payload: { type: CentenaMsgType.KEY_PRESSED, key } });
    const handleConfirmInput = () => dispatch({ type: 'CENTENA', payload: { type: CentenaMsgType.CONFIRM_INPUT } });

    return {
        centenaList,
        editingAmountType,
        currentInput,
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