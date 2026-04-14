import { useCallback, useEffect } from 'react';
import { useRewardContext } from './core/store';
import { RewardUpdate } from './core/update';
import { RewardService } from './core/service';
import { RewardSelectors } from './core/selectors';

export const useRewards = () => {
  const { state, dispatch } = useRewardContext();

  const fetchRewards = useCallback(async () => {
    dispatch(RewardUpdate.fetchStarted());
    try {
      const data = await RewardService.getBetTypesWithRewards();
      dispatch(RewardUpdate.fetchSuccess(data));
    } catch (error: any) {
      dispatch(RewardUpdate.fetchFailure(error?.message || 'Error al cargar premios'));
    }
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(RewardUpdate.reset());
  }, [dispatch]);

  return {
    status: RewardSelectors.selectStatus(state),
    data: RewardSelectors.selectData(state),
    error: RewardSelectors.selectError(state),
    isLoading: RewardSelectors.selectIsLoading(state),
    hasError: RewardSelectors.selectHasError(state),
    hasData: RewardSelectors.selectHasData(state),
    drawTypes: RewardSelectors.selectDrawTypes(state),
    bankName: RewardSelectors.selectBankName(state),
    fetchRewards,
    reset,
  };
};
