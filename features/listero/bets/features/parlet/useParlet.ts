import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { ParletMsgType } from './parlet.types';
import { KeyboardMsgType } from '../keyboard/keyboard.types';
import { FijosCorridosBet } from '@/types';

export const useParlet = (fijosCorridosList: FijosCorridosBet[]) => {
  const model = useBetsStore(selectBetsModel);
  const dispatch = useBetsStore(selectDispatch);

  const {
    listSession,
    editSession,
    parletSession,
  } = model;

  const parletList =
    listSession.remoteData.type === 'Success'
      ? listSession.remoteData.data.parlets
      : [];

  const {
    editingAmountType,
    currentInput,
  } = editSession;

  const {
    isParletDrawerVisible,
    isAmountDrawerVisible,
  } = parletSession;

  const editParletBet = (betId: string) => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.EDIT_PARLET_BET, betId } });
  const editAmountKeyboard = (betId: string) => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.OPEN_PARLET_AMOUNT_KEYBOARD, betId } });
  const pressAddParlet = () => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.PRESS_ADD_PARLET, fijosCorridosList } });
  const showParletDrawer = (visible: boolean) => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.SHOW_PARLET_DRAWER, visible } });
  const showAmountDrawer = (visible: boolean) => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.SHOW_PARLET_MODAL, visible } });
  const handleKeyPress = (key: string) => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.KEY_PRESSED, key } });
  const handleConfirmInput = () => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.CONFIRM_INPUT } });

  return {
    parletList,
    editingAmountType,
    currentInput,
    isParletDrawerVisible,
    isAmountDrawerVisible,
    editParletBet,
    editAmountKeyboard,
    pressAddParlet,
    showParletDrawer,
    showAmountDrawer,
    handleKeyPress,
    handleConfirmInput,
  };
};
