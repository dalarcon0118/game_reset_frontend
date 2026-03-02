import { useEffect, useCallback } from 'react';
import { FijosCorridosBet } from '@/types';
import { useBolitaStore, selectBolitaModel, selectDispatch } from '../store';
import { FIJOS, KEY_PRESSED, FijosMessages } from '../../domain/models/bolita.messages';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('USE_FIJOS');

/**
 * ViewModel hook para gestionar Fijos/Corridos.
 * Following the TEA Clean Feature Design.
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
    currentInput,
    editingAmountType,
  } = editState;

  log.debug('state:', { showBetKeyboard, showAmountKeyboard, currentInput, editingAmountType });

  const fijosCorridos = isEditing
    ? entrySession.fijosCorridos
    : (listState.remoteData.type === 'Success'
      ? listState.remoteData.data.fijosCorridos
      : []);

  const openBetKeyboard = useCallback(() => dispatch(FIJOS(FijosMessages.OPEN_BET_KEYBOARD())), [dispatch]);
  const closeBetKeyboard = useCallback(() => dispatch(FIJOS(FijosMessages.CLOSE_BET_KEYBOARD())), [dispatch]);
  const openAmountKeyboard = useCallback((betId: string, amountType: 'fijo' | 'corrido') =>
    dispatch(FIJOS(FijosMessages.OPEN_AMOUNT_KEYBOARD({ betId, amountType }))), [dispatch]);
  const closeAmountKeyboard = useCallback(() => dispatch(FIJOS(FijosMessages.CLOSE_AMOUNT_KEYBOARD())), [dispatch]);
  const processBetInput = useCallback((inputString: string) =>
    dispatch(FIJOS(FijosMessages.PROCESS_BET_INPUT({ inputString }))), [dispatch]);
  const submitAmountInput = useCallback((amountString: string) =>
    dispatch(FIJOS(FijosMessages.SUBMIT_AMOUNT_INPUT({ amountString }))), [dispatch]);
  const handleKeyPress = useCallback((key: string) => dispatch(KEY_PRESSED({ key })), [dispatch]);
  const handleConfirmInput = useCallback(() => dispatch(FIJOS(FijosMessages.FIJOS_CONFIRM_INPUT())), [dispatch]);

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
