import { useCallback, useEffect } from 'react';
import { useWinningContext } from './core/store';
import { WinningUpdate } from './core/update';
import { WinningService } from './core/service';
import { WinningSelectors } from './core/selectors';

export const useWinnings = () => {
  const { state, dispatch } = useWinningContext();

  const fetchWinnings = useCallback(async () => {
    dispatch(WinningUpdate.fetchStarted());
    const result = await WinningService.getDrawsWithWinners();
    
    if (result.isOk()) {
      dispatch(WinningUpdate.fetchSuccess(result.value));
    } else {
      dispatch(WinningUpdate.fetchFailure(result.error.message));
    }
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(WinningUpdate.reset());
  }, [dispatch]);

  return {
    status: WinningSelectors.selectStatus(state),
    draws: WinningSelectors.selectDraws(state),
    error: WinningSelectors.selectError(state),
    isLoading: WinningSelectors.selectIsLoading(state),
    hasError: WinningSelectors.selectHasError(state),
    hasData: WinningSelectors.selectHasData(state),
    fetchWinnings,
    reset,
  };
};
