import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { FijosCorridosBet } from '@/types'; // Asegúrate que la ruta es correcta
import { GameTypes } from '@/constants/Bet'; // Asegúrate que la ruta es correcta
import { useFijosParletStore } from '../store/fijosParlet.store'; // Importar el store

/**
 * ViewModel hook para gestionar Fijos/Corridos usando Zustand.
 */
export const useFijosParlet = ({ onSelectPlay }: { onSelectPlay: (bets: FijosCorridosBet[]) => void }) => {
  // Seleccionar piezas individuales del estado para optimizar re-renders
  const showBetKeyboard = useFijosParletStore(state => state.showBetKeyboard);
  const showAmountKeyboard = useFijosParletStore(state => state.showAmountKeyboard);
  const fijosCorridosList = useFijosParletStore(state => state.fijosCorridosList);
  const amountConfirmationDetails = useFijosParletStore(state => state.amountConfirmationDetails);

  // Las acciones son estables y se pueden obtener directamente del estado del store
  // o mediante getState() para no suscribirse si solo se necesitan acciones.
  // Aquí las obtenemos de getState() ya que las piezas de estado ya están suscritas individualmente.
  const {
    handleAddBetPress,
    handleAmountCirclePress,
    processBetInput,
    submitAmountInput,
    confirmApplyAmountToAllBuffered,
    confirmApplyAmountToSingle,
    cancelAmountConfirmation,
    hideBetKeyboard,
    hideAmountKeyboard,
  } = useFijosParletStore.getState();

  // Efecto para llamar a onSelectPlay cuando fijosCorridosList cambia
  useEffect(() => {
    if (fijosCorridosList.length > 0) {
      onSelectPlay(fijosCorridosList);
    }
     // De forma opcional, si onSelectPlay(null) o onSelectPlay([]) es válido para resetear:
    // else { 
    //   onSelectPlay([]); 
    // }
  }, [fijosCorridosList, onSelectPlay]);

  // Efecto para mostrar el Alert cuando amountConfirmationDetails cambia
  useEffect(() => {
    if (amountConfirmationDetails) {
      const { amountValue, intendedAmountType } = amountConfirmationDetails;
      Alert.alert(
        "Confirmar Monto",
        `Desea colocar ${amountValue} a todos los números anteriores en ${intendedAmountType === 'fijo' ? GameTypes.FIJO : GameTypes.CORRIDO}?`,
        [
          { text: "Cancelar", onPress: cancelAmountConfirmation, style: "cancel" },
          { text: "Sólo a éste", onPress: confirmApplyAmountToSingle },
          { text: "Sí, a todos", onPress: confirmApplyAmountToAllBuffered }
        ],
        { cancelable: false }
      );
    }
  }, [amountConfirmationDetails, confirmApplyAmountToAllBuffered, confirmApplyAmountToSingle, cancelAmountConfirmation]);
  
  return {
    fijosCorridosList, // Devuelve la lista seleccionada
    showBetKeyboard,   // Devuelve el estado seleccionado
    showAmountKeyboard,// Devuelve el estado seleccionado
    // Las funciones devueltas se memoizan con useCallback para mantener referencias estables para los consumidores del hook.
    handleAddBetPress: useCallback(handleAddBetPress, [handleAddBetPress]),
    handleAmountCirclePress: useCallback(handleAmountCirclePress, []),
    hideBetKeyboard: useCallback(hideBetKeyboard, [hideBetKeyboard]),
    hideAmountKeyboard: useCallback(hideAmountKeyboard, [hideAmountKeyboard]),
    processBetInput: useCallback(processBetInput, [processBetInput]),
    handleAmountKeyboardInput: useCallback(submitAmountInput, []),
  };
};