import { useCallback } from 'react';
import { useRewardStore, useRewardDispatch } from './core/store';
import { FETCH_BET_TYPES_REQUESTED } from './core/types';
import { BetTypeWithRewardsResponse, DrawTypeWithBetTypes } from '@/shared/services/draw/types';

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
  const status = betTypesStatus._tag === 'NotAsked' ? 'NotAsked' as const
    : betTypesStatus._tag === 'Loading' ? 'Loading' as const
    : betTypesStatus._tag === 'Success' ? 'Success' as const
    : 'Failure' as const;
  
  const data = betTypesStatus._tag === 'Success' ? betTypesStatus.data : null;
  const error = betTypesStatus._tag === 'Failure' ? betTypesStatus.error : null;
  const isLoading = betTypesStatus._tag === 'Loading';
  const hasError = betTypesStatus._tag === 'Failure';
  const hasData = betTypesStatus._tag === 'Success' && betTypesStatus.data !== null;
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
