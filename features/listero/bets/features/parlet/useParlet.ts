import { useState, useEffect } from 'react';
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

  const {
    parlets: parletList,
  } = listSession;

  const {
    editingAmountType,
  } = editSession;

  const {
    isParletDrawerVisible,
    isAmmountDrawerVisible,
    activeParletBetId,
    fromFijosyCorridoBet,
    potentialParletNumbers
  } = parletSession;

  const [value, setValue] = useState("");

  const cancelParletBet = () => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.CANCEL_PARLET_BET } });
  const confirmParletBet = () => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.CONFIRM_PARLET_BET } });
  const editParletBet = (betId: string) => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.EDIT_PARLET_BET, betId } });
  const editAmmountKeyboard = (betId: string) => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.OPEN_PARLET_AMOUNT_KEYBOARD, betId } });
  const pressAddParlet = () => dispatch({ type: 'PARLET', payload: { type: ParletMsgType.PRESS_ADD_PARLET, fijosCorridosList } });
  const showParletDrawer = () => dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.CLOSE_BET_KEYBOARD } });
  const showAmmountDrawer = () => dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.CLOSE_AMOUNT_KEYBOARD } });
  const processBetInput = (inputString: string) => dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.PROCESS_BET_INPUT, inputString } });
  const processAmountInput = (amountString: string) => dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.SUBMIT_AMOUNT_INPUT, amountString } });

  useEffect(() => {
    if (activeParletBetId && parletList.length > 0) {
      const parlet = parletList.find((bet) => bet.id === activeParletBetId);
      if (parlet) {
        if (!isAmmountDrawerVisible) {
          setValue(parlet.bets.map((b: number) => b.toString().padStart(2, '0')).join(""));
        } else {
          setValue(parlet.amount?.toString() || "");
        }
      }
    } else {
      setValue("");
    }
  }, [activeParletBetId, parletList, isAmmountDrawerVisible]);

  return {
    parletList,
    editingAmountType,
    isParletDrawerVisible,
    isAmmountDrawerVisible,
    activeParletBetId,
    fromFijosyCorridoBet,
    potentialParletNumbers,
    value,
    cancelParletBet,
    confirmParletBet,
    editParletBet,
    editAmmountKeyboard,
    pressAddParlet,
    showParletDrawer,
    showAmmountDrawer,
    processBetInput,
    processAmountInput
  };
};
