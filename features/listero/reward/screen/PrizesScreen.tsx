import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { match } from 'ts-pattern';
import Colors from '@/constants/colors';
import { useRewards } from '../use_rewards';
import { logger } from '@/shared/utils/logger';
import { PrizesLoading } from './parts/PrizesLoading';
import { PrizesError } from './parts/PrizesError';
import { PrizesEmpty } from './parts/PrizesEmpty';
import { PrizesList } from './parts/PrizesList';

const log = logger.withTag('PrizesScreen');

export const PrizesScreen: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  const { status, drawTypes, bankName, error, isLoading, hasError, hasData, fetchRewards } = useRewards();

  useEffect(() => {
    log.info('[PrizesScreen]Mounting, fetching rewards');
    fetchRewards();
  }, [fetchRewards]);

  log.debug('[PrizesScreen]Render state', {
    status,
    isLoading,
    hasError,
    hasData,
  });

  return match({ status, isLoading, hasError, hasData })
    .with({ isLoading: true }, () => (
      <PrizesLoading theme={theme} insets={insets} />
    ))
    .with({ status: 'NotAsked' }, () => (
      <PrizesLoading theme={theme} insets={insets} />
    ))
    .with({ hasError: true }, () => (
      <PrizesError theme={theme} insets={insets} onRetry={fetchRewards} />
    ))
    .with({ status: 'Success', hasData: false }, () => (
      <PrizesEmpty theme={theme} insets={insets} />
    ))
    .with({ status: 'Success', hasData: true }, () => (
      <PrizesList drawTypes={drawTypes} bankName={bankName} theme={theme} />
    ))
    .exhaustive(() => (
      <PrizesEmpty theme={theme} insets={insets} />
    ));
};

export default PrizesScreen;
