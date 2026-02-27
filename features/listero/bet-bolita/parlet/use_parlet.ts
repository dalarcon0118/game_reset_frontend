import { useBolitaStore, selectBolitaModel, selectDispatch } from '../core/store';
import { PARLET } from '../core/types';
import {
  EDIT_PARLET_BET,
  OPEN_PARLET_AMOUNT_KEYBOARD,
  PRESS_ADD_PARLET,
  SHOW_PARLET_DRAWER,
  SHOW_PARLET_MODAL,
  CLOSE_AMOUNT_KEYBOARD,
  CLOSE_BET_KEYBOARD,
  KEY_PRESSED,
  CONFIRM_INPUT
} from './parlet.types';
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

  const editParletBet = (betId: string) => dispatch(PARLET(EDIT_PARLET_BET({ betId })));
  const editAmountKeyboard = (betId: string) => dispatch(PARLET(OPEN_PARLET_AMOUNT_KEYBOARD({ betId })));
  const pressAddParlet = () => dispatch(PARLET(PRESS_ADD_PARLET({ fijosCorridosList })));
  const showParletDrawer = (visible: boolean) => dispatch(PARLET(SHOW_PARLET_DRAWER({ visible })));
  const showAmountDrawer = (visible: boolean) => dispatch(PARLET(SHOW_PARLET_MODAL({ visible })));
  const hideAmountKeyboard = () => dispatch(PARLET(CLOSE_AMOUNT_KEYBOARD()));
  const hideBetKeyboard = () => dispatch(PARLET(CLOSE_BET_KEYBOARD()));
  const handleKeyPress = (key: string) => dispatch(PARLET(KEY_PRESSED({ key })));
  const handleConfirmInput = () => dispatch(PARLET(CONFIRM_INPUT()));

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
