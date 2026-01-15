import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { DashboardOperations } from './DashboardOperations';
import { BankHealth } from './BankHealth';
import { useTheme } from '@ui-kitten/components';
import { RefreshControl } from 'react-native';
import { useBankerDashboard } from '../hook/dashboard.hook';

export default function BankerDashboardScreen() {
  const theme = useTheme();
  const { 
    isLoading, 
    agencies, 
    summary, 
    onSelected,
    refresh,
    onRulesPress,
    onListPress,
  } = useBankerDashboard();

  return (
    <Flex vertical flex={1} background={theme['background-basic-color-1']} padding={[{type:"top", value:20}]}>
      <DashboardHeader isLoading={isLoading} onRefresh={refresh} />
      <DashboardStats summary={summary} />

      <SafeAreaView style={styles.safeArea}>
        <Flex
              vertical
              flex={1}
              scroll={{
                showsVerticalScrollIndicator: false,
                refreshControl: (
                  <RefreshControl
                    refreshing={isLoading}
                    onRefresh={refresh}
                    colors={[COLORS.primary]}
                    tintColor={COLORS.primary}
                  />
                )
              }}
              padding={[{ type: 'horizontal', value: 20 }, { type: 'bottom', value: 40 }]}
            >
              <BankHealth />
              <DashboardOperations 
                  agencies={agencies} 
                  isLoading={isLoading} 
                  onSelected={onSelected}
                  onRulesPress={onRulesPress}
                  onListPress={onListPress}
                  onRefresh={refresh} />
            </Flex>
       
      </SafeAreaView>
    </Flex>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
