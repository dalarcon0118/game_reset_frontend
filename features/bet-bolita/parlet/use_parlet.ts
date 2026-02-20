import { useBetsStore, selectBetsModel, selectDispatch } from '../../bet-workspace/core/store';
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
  const model = useBetsStore(selectBetsModel);
  const dispatch = useBetsStore(selectDispatch);

  const {
    listSession,
    editSession,
    parletSession,
    isEditing,
    entrySession
  } = model;

  const parletList = isEditing
    ? entrySession.parlets
    : (listSession.remoteData.type === 'Success'
      ? listSession.remoteData.data.parlets
      : []);

  const {
    editingAmountType,
    currentInput,
    showAmountKeyboard,
    showBetKeyboard,
  } = editSession;

  const {
    isParletDrawerVisible,
    isParletModalVisible,
  } = parletSession;

  const editParletBet = (betId: string) => dispatch({ type: 'PARLET', payload: EDIT_PARLET_BET({ betId }) });
  const editAmountKeyboard = (betId: string) => dispatch({ type: 'PARLET', payload: OPEN_PARLET_AMOUNT_KEYBOARD({ betId }) });
  const pressAddParlet = () => dispatch({ type: 'PARLET', payload: PRESS_ADD_PARLET({ fijosCorridosList }) });
  const showParletDrawer = (visible: boolean) => dispatch({ type: 'PARLET', payload: SHOW_PARLET_DRAWER({ visible }) });
  const showAmountDrawer = (visible: boolean) => dispatch({ type: 'PARLET', payload: SHOW_PARLET_MODAL({ visible }) });
  const hideAmountKeyboard = () => dispatch({ type: 'PARLET', payload: CLOSE_AMOUNT_KEYBOARD() });
  const hideBetKeyboard = () => dispatch({ type: 'PARLET', payload: CLOSE_BET_KEYBOARD() });
  const handleKeyPress = (key: string) => dispatch({ type: 'PARLET', payload: KEY_PRESSED({ key }) });
  const handleConfirmInput = () => dispatch({ type: 'PARLET', payload: CONFIRM_INPUT() });

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
