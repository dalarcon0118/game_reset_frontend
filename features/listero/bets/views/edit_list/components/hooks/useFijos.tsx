import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { FijosCorridosBet } from '@/types';
import { GameTypes } from '@/constants/Bet';
import { useBets } from '../../../hooks/useBets';

/**
 * ViewModel hook para gestionar Fijos/Corridos usando el store TEA centralizado.
 */
export const useFijosParlet = ({ onSelectPlay }: { onSelectPlay: (bets: FijosCorridosBet[]) => void }) => {
  // Usar el hook centralizado del store TEA
  const {
    showBetKeyboard,
    showAmountKeyboard,
    fijosCorridos,
    amountConfirmationDetails,
    openBetKeyboard,
    closeBetKeyboard,
    openAmountKeyboard,
    closeAmountKeyboard,
    processBetInput,
    submitAmountInput,
    confirmApplyAmountAll,
    confirmApplyAmountSingle,
    cancelAmountConfirmation,
  } = useBets();

  // Efecto para llamar a onSelectPlay cuando fijosCorridos cambia
  useEffect(() => {
    if (fijosCorridos.length > 0) {
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
    fijosCorridosList: fijosCorridos, // Devuelve la lista del store centralizado
    showBetKeyboard,
    showAmountKeyboard,
    handleAddBetPress: useCallback(() => openBetKeyboard(), [openBetKeyboard]),
    handleAmountCirclePress: useCallback((betId: string, amountType: 'fijo' | 'corrido') => {
      openAmountKeyboard(betId, amountType);
    }, [openAmountKeyboard]),
    hideBetKeyboard: useCallback(() => closeBetKeyboard(), [closeBetKeyboard]),
    hideAmountKeyboard: useCallback(() => closeAmountKeyboard(), [closeAmountKeyboard]),
    processBetInput: useCallback(processBetInput, [processBetInput]),
    handleAmountKeyboardInput: useCallback(submitAmountInput, [submitAmountInput]),
  };
};
