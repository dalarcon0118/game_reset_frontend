import React from 'react';
import { StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useTheme } from '@ui-kitten/components';

import { Flex } from '@/shared/components/flex';
import { useBankerDashboardStore, selectIsLoading } from '../../core';
import { DashboardHeader, DashboardStats, BankHealth, DashboardOperations } from '../components';

export default function BankerDashboardScreen() {
  const theme = useTheme();
  const { model, dispatch } = useBankerDashboardStore();

  const isLoading = selectIsLoading(model);
  const refresh = () => dispatch({ type: 'REFRESH_CLICKED' });

  return (
    <Flex vertical flex={1} background={theme['background-basic-color-1']} padding={[{type:"top", value:20}]}>
      <DashboardHeader />
      <DashboardStats />

      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme['background-basic-color-1'] }]}>
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
   
      </SafeAreaView>
    </Flex>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
