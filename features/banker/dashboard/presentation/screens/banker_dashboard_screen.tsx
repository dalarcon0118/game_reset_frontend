import React from 'react';
import { StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '@ui-kitten/components';

import { Flex, ScreenContainer } from '@/shared/components';
import { useBankerDashboardStore, selectIsLoading } from '../../core';
import { DashboardHeader, DashboardStats, BankHealth, DashboardOperations } from '../components';

export default function BankerDashboardScreen() {
  const theme = useTheme();
  const { model, dispatch } = useBankerDashboardStore();

  const isLoading = selectIsLoading(model);
  const refresh = () => dispatch({ type: 'REFRESH_CLICKED' });

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      backgroundColor={theme['background-basic-color-1']}
    >
      <DashboardHeader />
      <DashboardStats />

      <Flex
        vertical
        flex={1}
        scroll={{
          showsVerticalScrollIndicator: false,
          refreshControl: (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              colors={[theme['color-primary-500']]}
              tintColor={theme['color-primary-500']}
            />
          )
        }}
        padding={[{ type: 'horizontal', value: 20 }, { type: 'bottom', value: 40 }]}
      >
        <BankHealth />
        <DashboardOperations />
      </Flex>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
