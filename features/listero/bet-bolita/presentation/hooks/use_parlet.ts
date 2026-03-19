import { useBolitaDispatch, useBolitaModel } from '../store';
import { PARLET, ParletMessages } from '../../domain/models/bolita.messages';
import { FijosCorridosBet } from '@/types';
import { useBolitaActions } from './use_bolita_actions';

export const useParlet = (fijosCorridosList: FijosCorridosBet[]) => {
  const model = useBolitaModel();
  const dispatch = useBolitaDispatch();
  const { parlet: actions } = useBolitaActions();

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

  const showParletDrawer = (visible: boolean) => dispatch(PARLET(ParletMessages.SHOW_PARLET_DRAWER({ visible })));
  const showAmountDrawer = (visible: boolean) => dispatch(PARLET(ParletMessages.SHOW_PARLET_MODAL({ visible })));

  return {
    parletList,
    editingAmountType,
    isParletDrawerVisible,
    isParletModalVisible,
    editParletBet: actions.editBet,
    editAmountKeyboard: actions.openAmountKeyboard,
    pressAddParlet: () => actions.openBetKeyboard(fijosCorridosList),
    showParletDrawer,
    showAmountDrawer,
  };
};
