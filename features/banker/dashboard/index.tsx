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
import { useDashboardStore, selectDashboardModel, selectDashboardDispatch } from './core';
import { useAuth } from '../../auth';

export default function BankerDashboardScreen() {
  const theme = useTheme();
  const model = useDashboardStore(selectDashboardModel);
  const dispatch = useDashboardStore(selectDashboardDispatch);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.structure?.id && !model.userStructureId) {
      dispatch({ type: 'FETCH_DATA_REQUESTED', structureId: String(user.structure.id) });
    }
  }, [user?.structure?.id, model.userStructureId, dispatch]);

  const isLoading = model.agencies.type === 'Loading' || model.summary.type === 'Loading';
  const agencies = model.agencies.type === 'Success' ? model.agencies.data : null;
  const summary = model.summary.type === 'Success' ? model.summary.data : null;

  const onSelected = (id: number) => dispatch({ type: 'AGENCY_SELECTED', agencyId: id });
  const refresh = () => dispatch({ type: 'REFRESH_CLICKED' });
  const onRulesPress = (id: number) => dispatch({ type: 'RULES_PRESSED', agencyId: id });
  const onListPress = (id: number) => dispatch({ type: 'LIST_PRESSED', agencyId: id });

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
