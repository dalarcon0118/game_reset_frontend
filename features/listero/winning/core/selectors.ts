/**
 * Winning Module - Selectors Memoizados
 * 
 * Hooks pre-construidos y memoizados para selección de estado TEA.
 * Esto estabiliza los selectors y evita que Zustand detecte cambios falsos
 * cuando el componente se re-renderiza.
 */

import { useCallback } from 'react';
import { useWinningStore } from './store';
import { RemoteData } from '@core/tea-utils';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';
import { WinningModel } from './types';

// Tipo para el estado completo del store
interface WinningStoreState {
  model: WinningModel;
  dispatch: (msg: any) => void;
}

/**
 * Hook memoizado: Selecciona draws del modelo
 * Estabilizado con useCallback para mantener referencia entre renders
 */
export const useWinningDraws = () => {
  const selector = useCallback((state: WinningStoreState) => state.model.draws, []);
  return useWinningStore(selector);
};

/**
 * Hook memoizado: Verifica si draws está en estado loading
 */
export const useWinningIsLoading = () => {
  const selector = useCallback(
    (state: WinningStoreState) => RemoteData.isLoading(state.model.draws),
    []
  );
  return useWinningStore(selector);
};

/**
 * Hook memoizado: Verifica si draws está en estado error
 */
export const useWinningHasError = () => {
  const selector = useCallback(
    (state: WinningStoreState) => RemoteData.isFailure(state.model.draws),
    []
  );
  return useWinningStore(selector);
};

/**
 * Hook memoizado: Verifica si hay datos disponibles
 */
export const useWinningHasData = () => {
  const selector = useCallback(
    (state: WinningStoreState) => 
      RemoteData.isSuccess(state.model.draws) && (state.model.draws as any).data?.length > 0,
    []
  );
  return useWinningStore(selector);
};

/**
 * Hook memoizado: Selecciona userWinnings del modelo
 */
export const useWinningUserWinnings = () => {
  const selector = useCallback(
    (state: WinningStoreState): WinningBet[] => {
      const w = state.model.userWinnings;
      return RemoteData.isSuccess(w) ? w.data : [];
    },
    []
  );
  return useWinningStore(selector);
};

/**
 * Hook memoizado: Selecciona pendingRewardsCount del modelo
 */
export const useWinningPendingRewardsCount = () => {
  const selector = useCallback(
    (state: WinningStoreState) => state.model.pendingRewardsCount,
    []
  );
  return useWinningStore(selector);
};
