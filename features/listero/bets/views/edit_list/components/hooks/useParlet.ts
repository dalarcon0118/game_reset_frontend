import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Cmd, useParletStore } from '../store/parlet.store';
import { useParletUIStore } from '../store/parletUI.store';
import { ParletBet, FijosCorridosBet } from '@/types';
import { AnnotationTypes } from '@/constants/Bet';

export const useParlet = () => {
  // UI State from UI store
  const {
    isParletDrawerVisible,
    isParletModalVisible,
    isAmmountDrawerVisible,
    parletAlertVisibleState,
    showParletDrawer,
    showParletModal,
    showAmmountDrawer,
    showParletAlert,
    closeAllDrawers,
  } = useParletUIStore();

  // Business State from main store
  const {
    potentialParletNumbers,
    newParletBet,
    parletList,
    activeParletBetId,
    fromFijosyCorridoBet,
    canceledFromFijosyCorridoBet,
    isError,
    errorMessage,
    cmd,
    activeAnnotationType
  } = useParletStore();

  // Actions from main store
  const {
    pressAddParlet,
    confirmParletBet,
    cancelParletBet,
    processAmountInput,
    processBetInput,
    editParletBet,
    setActiveParletBet,
    addParletBet,
    updateParletBet,
    deleteParletBet,
    activateAnnotationType,
    clearError,
    editAmmountKeyboard,
    resetCmd
  } = useParletStore.getState();

  const [value, setValue] = useState("");

  //en caso que exista una apuesta "activa
  // se busca en la lista de apuestas
  // si se encuentra entonces en caso de que el annotationType sea Bet se muestra los numeros de la apuesta
  // si se encuentra entonces en caso de que el annotationType sea Amount se muestra el monto de la apuesta
  useEffect(() => {

    if (activeParletBetId && parletList.length > 0) {
      const parletbets: ParletBet | undefined = parletList.find((bet) => bet.id === activeParletBetId);
      if (parletbets) {
        if (activeAnnotationType === AnnotationTypes.Bet)
          setValue(parletbets.bets.join(""));
        if (activeAnnotationType === AnnotationTypes.Amount)
          setValue(parletbets?.amount?.toString() || "");
      }

    }
  }, [activeParletBetId])

  // Manejo de los comandos 
  useEffect(() => {
    if (cmd === Cmd.Add || cmd === Cmd.Edit) {
      if (activeAnnotationType === AnnotationTypes.Bet && !potentialParletNumbers.length) showParletDrawer(true);
      if (activeAnnotationType === AnnotationTypes.Amount) showAmmountDrawer(true);
    }
    if (cmd === Cmd.Added || cmd === Cmd.Edited) {
      showParletDrawer(false);
      showAmmountDrawer(false);
    }
  }, [cmd]);

  useEffect(() => {
    if (!isParletDrawerVisible) {
      resetCmd();
      setActiveParletBet("");
      setValue("");
    }
  }, [isParletDrawerVisible])

  // Effect to show the Alert modal when parletAlertVisibleState and potentialParletNumbers are set
  useEffect(() => {

    if (fromFijosyCorridoBet) {
      Alert.alert(
        "Desea Agregar estos numeros como parlet?",
        `Lista de numeros  [${potentialParletNumbers.join(', ')}] como parlet?`,
        [
          {
            text: "Cancel",
            onPress: cancelParletBet,
            style: "cancel"
          },
          {
            text: "OK",
            onPress: () => { confirmParletBet(); closeAllDrawers() }
          }
        ]
      );
    }
  }, [parletAlertVisibleState, potentialParletNumbers, cancelParletBet, confirmParletBet, fromFijosyCorridoBet]);

  // Mostrar errores provenientes del store en UI y limpiar estado
  useEffect(() => {
    if (isError && errorMessage) {
      Alert.alert('Error', errorMessage, [{ text: 'OK', onPress: clearError }]);
    }
  }, [isError, errorMessage, clearError]);

  return {
    value,
    // UI State
    isParletDrawerVisible,
    isParletModalVisible,
    isAmmountDrawerVisible,
    parletAlertVisibleState,

    // Business State
    potentialParletNumbers,
    newParletBet,
    parletList,
    activeParletBetId,
    fromFijosyCorridoBet,
    canceledFromFijosyCorridoBet,
    isError,
    errorMessage,

    // UI Actions
    showParletDrawer: useCallback(showParletDrawer, [showParletDrawer]),
    showParletModal: useCallback(showParletModal, [showParletModal]),
    showAmmountDrawer: useCallback(showAmmountDrawer, [showAmmountDrawer]),
    showParletAlert: useCallback(showParletAlert, [showParletAlert]),
    closeAllDrawers: useCallback(closeAllDrawers, [closeAllDrawers]),

    // Business Actions
    editAmmountKeyboard: useCallback(editAmmountKeyboard, [editAmmountKeyboard]),

    pressAddParlet: useCallback(pressAddParlet, [pressAddParlet]),
    confirmParletBet: useCallback(confirmParletBet, [confirmParletBet]),
    cancelParletBet: useCallback(cancelParletBet, [cancelParletBet]),
    processAmountInput: useCallback(processAmountInput, [processAmountInput]),
    processBetInput: useCallback(processBetInput, [processBetInput]),
    editParletBet: useCallback(editParletBet, [editParletBet]),
    setActiveParletBet: useCallback(setActiveParletBet, [setActiveParletBet]),
    addParletBet: useCallback(addParletBet, [addParletBet]),
    updateParletBet: useCallback(updateParletBet, [updateParletBet]),
    deleteParletBet: useCallback(deleteParletBet, [deleteParletBet]),
    activateAnnotationType: useCallback(activateAnnotationType, [activateAnnotationType]),
    clearError: useCallback(clearError, [clearError]),
  };
};