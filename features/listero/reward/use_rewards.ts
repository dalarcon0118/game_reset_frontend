import { useCallback } from 'react';
import { useRewardStore, useRewardDispatch } from './core/store';
import { FETCH_BET_TYPES_REQUESTED } from './core/types';
import { BetTypeWithRewardsResponse, DrawTypeWithBetTypes } from '@/shared/services/draw/types';
import { RemoteData } from '@core/tea-utils';

export interface RewardSelectorsOutput {
  status: 'NotAsked' | 'Loading' | 'Success' | 'Failure';
  data: BetTypeWithRewardsResponse | null;
  error: string | null;
  isLoading: boolean;
  hasError: boolean;
  hasData: boolean;
  drawTypes: DrawTypeWithBetTypes[];
  bankName: string | null;
}

export const useRewards = () => {
  const { model } = useRewardStore();
  const dispatch = useRewardDispatch();

  const betTypesStatus = model.betTypes.status;
  const status = betTypesStatus.type === 'NotAsked' ? 'NotAsked' as const
    : betTypesStatus.type === 'Loading' ? 'Loading' as const
    : betTypesStatus.type === 'Success' ? 'Success' as const
    : 'Failure' as const;
  
  const data = betTypesStatus.type === 'Success' ? betTypesStatus.data : null;
  const error = betTypesStatus.type === 'Failure' ? betTypesStatus.error as string : null;
  const isLoading = betTypesStatus.type === 'Loading';
  const hasError = betTypesStatus.type === 'Failure';
  const hasData = betTypesStatus.type === 'Success' && betTypesStatus.data !== null;
  const drawTypes: DrawTypeWithBetTypes[] = data?.draw_types || [];
  const bankName = data?.bank_name || null;

  const fetchRewards = useCallback(() => {
    dispatch(FETCH_BET_TYPES_REQUESTED());
  }, [dispatch]);

  return {
    status,
    data,
    error,
    isLoading,
    hasError,
    hasData,
    drawTypes,
    bankName,
    fetchRewards,
    reset: () => { /* Reset not needed in new architecture */ }
  };
};