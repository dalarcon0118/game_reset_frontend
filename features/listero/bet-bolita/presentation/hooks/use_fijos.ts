import { useEffect } from 'react';
import { FijosCorridosBet } from '@/types';
import { useBolitaModel } from '../store';
import { logger } from '@/shared/utils/logger';
import { useBolitaActions } from './use_bolita_actions';

const log = logger.withTag('USE_FIJOS');

/**
 * ViewModel hook para gestionar Fijos/Corridos.
 * Following the TEA Clean Feature Design.
 */
export const useFijos = ({ onSelectPlay }: { onSelectPlay?: (bets: FijosCorridosBet[]) => void } = {}) => {
  const model = useBolitaModel();
  const { fijos: actions } = useBolitaActions();

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

  // Efecto para llamar a onSelectPlay cuando fijosCorridos cambia
  useEffect(() => {
    if (fijosCorridos.length > 0 && onSelectPlay) {
      onSelectPlay(fijosCorridos);
    }
  }, [fijosCorridos, onSelectPlay]);

  return {
    fijosCorridosList: fijosCorridos,
    editingAmountType,
    handleAddBetPress: actions.openBetKeyboard,
    handleAmountCirclePress: actions.openAmountKeyboard,
  };
};
