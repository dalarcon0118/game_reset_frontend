import { useEffect, useCallback } from 'react';
import { FijosCorridosBet } from '@/types';
import { GameTypes } from '@/constants/bet';
import { useBolitaStore, selectBolitaModel, selectDispatch } from '../core/store';
import { FIJOS } from '../core/types';
import { FijosCmd } from './fijos.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('USE_FIJOS');

/**
 * ViewModel hook para gestionar Fijos/Corridos usando el submódulo bet-fijos.
 */
export const useFijos = ({ onSelectPlay }: { onSelectPlay?: (bets: FijosCorridosBet[]) => void } = {}) => {
  const model = useBolitaStore(selectBolitaModel);
  const dispatch = useBolitaStore(selectDispatch);

  const {
    listState,
    editState,
    isEditing,
    entrySession
  } = model;

  const {
    showBetKeyboard,
    showAmountKeyboard,
    amountConfirmationDetails,
    currentInput,
    editingAmountType,
  } = editState;

  log.debug('state:', { showBetKeyboard, showAmountKeyboard, currentInput, editingAmountType });

  const fijosCorridos = isEditing
    ? entrySession.fijosCorridos
    : (listState.remoteData.type === 'Success'
      ? listState.remoteData.data.fijosCorridos
      : []);

  const openBetKeyboard = useCallback(() => dispatch(FIJOS(FijosCmd.OPEN_BET_KEYBOARD())), [dispatch]);
  const closeBetKeyboard = useCallback(() => dispatch(FIJOS(FijosCmd.CLOSE_BET_KEYBOARD())), [dispatch]);
  const openAmountKeyboard = useCallback((betId: string, amountType: 'fijo' | 'corrido') => dispatch(FIJOS(FijosCmd.OPEN_AMOUNT_KEYBOARD(betId, amountType))), [dispatch]);
  const closeAmountKeyboard = useCallback(() => dispatch(FIJOS(FijosCmd.CLOSE_AMOUNT_KEYBOARD())), [dispatch]);
  const processBetInput = useCallback((inputString: string) => dispatch(FIJOS(FijosCmd.PROCESS_BET_INPUT(inputString))), [dispatch]);
  const submitAmountInput = useCallback((amountString: string) => dispatch(FIJOS(FijosCmd.SUBMIT_AMOUNT_INPUT(amountString))), [dispatch]);
  const confirmApplyAmountAll = useCallback(() => dispatch(FIJOS(FijosCmd.CONFIRM_APPLY_AMOUNT_ALL())), [dispatch]);
  const confirmApplyAmountSingle = useCallback(() => dispatch(FIJOS(FijosCmd.CONFIRM_APPLY_AMOUNT_SINGLE())), [dispatch]);
  const cancelAmountConfirmation = useCallback(() => dispatch(FIJOS(FijosCmd.CANCEL_AMOUNT_CONFIRMATION())), [dispatch]);
  const handleKeyPress = useCallback((key: string) => dispatch(FIJOS(FijosCmd.KEY_PRESSED(key))), [dispatch]);
  const handleConfirmInput = useCallback(() => dispatch(FIJOS(FijosCmd.CONFIRM_INPUT())), [dispatch]);

  // Efecto para llamar a onSelectPlay cuando fijosCorridos cambia
  useEffect(() => {
    if (fijosCorridos.length > 0 && onSelectPlay) {
      onSelectPlay(fijosCorridos);
    }
  }, [fijosCorridos, onSelectPlay]);

  return {
    fijosCorridosList: fijosCorridos,
    showBetKeyboard,
    showAmountKeyboard,
    editingAmountType,
    currentInput,
    handleAddBetPress: openBetKeyboard,
    handleAmountCirclePress: openAmountKeyboard,
    hideBetKeyboard: closeBetKeyboard,
    hideAmountKeyboard: closeAmountKeyboard,
    processBetInput,
    handleAmountKeyboardInput: submitAmountInput,
    handleKeyPress,
    handleConfirmInput,
  };
};
