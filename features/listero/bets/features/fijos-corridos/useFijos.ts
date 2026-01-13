import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { FijosCorridosBet } from '@/types';
import { GameTypes } from '@/constants/Bet';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { FijosCmd, FijosMsgType } from './fijos.types';

/**
 * ViewModel hook para gestionar Fijos/Corridos usando el submódulo bet-fijos.
 */
export const useFijos = ({ onSelectPlay }: { onSelectPlay?: (bets: FijosCorridosBet[]) => void } = {}) => {
  const model = useBetsStore(selectBetsModel);
  const dispatch = useBetsStore(selectDispatch);

  const {
    listSession,
    editSession
  } = model;

  const {
    showBetKeyboard,
    showAmountKeyboard,
    amountConfirmationDetails,
    currentInput,
  } = editSession;

  const fijosCorridos =
    listSession.remoteData.type === 'Success'
      ? listSession.remoteData.data.fijosCorridos
      : [];

  const openBetKeyboard = useCallback(() => dispatch(FijosCmd.OPEN_BET_KEYBOARD()), [dispatch]);
  const closeBetKeyboard = useCallback(() => dispatch(FijosCmd.CLOSE_BET_KEYBOARD()), [dispatch]);
  const openAmountKeyboard = useCallback((betId: string, amountType: 'fijo' | 'corrido') => dispatch({ type: 'FIJOS', payload: { type: FijosMsgType.OPEN_AMOUNT_KEYBOARD, betId, amountType } }), [dispatch]);
  const closeAmountKeyboard = useCallback(() => dispatch(FijosCmd.CLOSE_AMOUNT_KEYBOARD()), [dispatch]);
  const processBetInput = useCallback((inputString: string) => dispatch(FijosCmd.PROCESS_BET_INPUT(inputString)), [dispatch]);
  const submitAmountInput = useCallback((amountString: string) => dispatch(FijosCmd.SUBMIT_AMOUNT_INPUT(amountString)), [dispatch]);
  const confirmApplyAmountAll = useCallback(() => dispatch(FijosCmd.CONFIRM_APPLY_AMOUNT_ALL()), [dispatch]);
  const confirmApplyAmountSingle = useCallback(() => dispatch(FijosCmd.CONFIRM_APPLY_AMOUNT_SINGLE()), [dispatch]);
  const cancelAmountConfirmation = useCallback(() => dispatch(FijosCmd.CANCEL_AMOUNT_CONFIRMATION()), [dispatch]);
  const handleKeyPress = useCallback((key: string) => dispatch(FijosCmd.KEY_PRESSED(key)), [dispatch]);
  const handleConfirmInput = useCallback(() => dispatch(FijosCmd.CONFIRM_INPUT()), [dispatch]);

  // Efecto para llamar a onSelectPlay cuando fijosCorridos cambia
  useEffect(() => {
    if (fijosCorridos.length > 0 && onSelectPlay) {
      onSelectPlay(fijosCorridos);
    }
  }, [fijosCorridos, onSelectPlay]);

  // Efecto para mostrar el Alert cuando amountConfirmationDetails cambia
  useEffect(() => {
    if (amountConfirmationDetails) {
      const { amountValue, intendedAmountType } = amountConfirmationDetails;
      Alert.alert(
        "Confirmar Monto",
        `Desea colocar ${amountValue} a todos los números anteriores en ${intendedAmountType === 'fijo' ? GameTypes.FIJO : GameTypes.CORRIDO}?`,
        [
          { text: "Cancelar", onPress: cancelAmountConfirmation, style: "cancel" },
          { text: "Sólo a éste", onPress: confirmApplyAmountSingle },
          { text: "Sí, a todos", onPress: confirmApplyAmountAll }
        ],
        { cancelable: false }
      );
    }
  }, [amountConfirmationDetails, confirmApplyAmountAll, confirmApplyAmountSingle, cancelAmountConfirmation]);

  return {
    fijosCorridosList: fijosCorridos,
    showBetKeyboard,
    showAmountKeyboard,
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
