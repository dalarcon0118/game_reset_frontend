import { useBolitaStore, selectBolitaModel, selectDispatch } from '../store';
import { PARLET, KEY_PRESSED, ParletMessages } from '../../domain/models/bolita.messages';
import { FijosCorridosBet } from '@/types';

export const useParlet = (fijosCorridosList: FijosCorridosBet[]) => {
  const model = useBolitaStore(selectBolitaModel);
  const dispatch = useBolitaStore(selectDispatch);

  const {
    listState,
    editState,
    parletSession,
    isEditing,
    entrySession
  } = model;

  const parletList = isEditing
    ? entrySession.parlets
    : (listState.remoteData.type === 'Success'
      ? listState.remoteData.data.parlets
      : []);

  const {
    editingAmountType,
    currentInput,
    showAmountKeyboard,
    showBetKeyboard,
  } = editState;

  const {
    isParletDrawerVisible,
    isParletModalVisible,
  } = parletSession;

  const editParletBet = (betId: string) => dispatch(PARLET(ParletMessages.EDIT_PARLET_BET({ betId })));
  const editAmountKeyboard = (betId: string) => dispatch(PARLET(ParletMessages.OPEN_PARLET_AMOUNT_KEYBOARD({ betId })));
  const pressAddParlet = () => dispatch(PARLET(ParletMessages.PRESS_ADD_PARLET({ fijosCorridosList })));
  const showParletDrawer = (visible: boolean) => dispatch(PARLET(ParletMessages.SHOW_PARLET_DRAWER({ visible })));
  const showAmountDrawer = (visible: boolean) => dispatch(PARLET(ParletMessages.SHOW_PARLET_MODAL({ visible })));
  const hideAmountKeyboard = () => dispatch(PARLET(ParletMessages.CLOSE_PARLET_AMOUNT_KEYBOARD()));
  const hideBetKeyboard = () => dispatch(PARLET(ParletMessages.CLOSE_PARLET_BET_KEYBOARD()));
  const handleKeyPress = (key: string) => dispatch(KEY_PRESSED({ key }));
  const handleConfirmInput = () => dispatch(PARLET(ParletMessages.PARLET_CONFIRM_INPUT()));

  return {
    parletList,
    editingAmountType,
    currentInput,
    showAmountKeyboard,
    showBetKeyboard,
    isParletDrawerVisible,
    isParletModalVisible,
    editParletBet,
    editAmountKeyboard,
    pressAddParlet,
    showParletDrawer,
    showAmountDrawer,
    hideAmountKeyboard,
    hideBetKeyboard,
    handleKeyPress,
    handleConfirmInput,
  };
};
