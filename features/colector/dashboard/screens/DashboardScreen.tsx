import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { useDashboardStore } from '../core';
import { REFRESH_CLICKED } from '../core/msg';
import { RemoteData } from '@/shared/core/remote.data';
import { DashboardHeader, DashboardStats, DashboardOperations } from '../components';
import { useTheme } from '@ui-kitten/components';

export default function DashboardScreen() {
  const { model, dispatch } = useDashboardStore();
  const theme = useTheme();

  const handleRefresh = () => {
    dispatch(REFRESH_CLICKED());
  };

  const isLoading = model.children.type === 'Loading';
  const children = RemoteData.withDefault([], model.children);

  return (
   <Flex vertical flex={1} background={theme['background-basic-color-1']} padding={[{type:"top", value:20}]}>
      <DashboardHeader isLoading={isLoading} onRefresh={handleRefresh} />
      <SafeAreaView style={styles.safeArea}>
        <DashboardStats />
        <DashboardOperations children={children} isLoading={isLoading} onRefresh={handleRefresh} />
      </SafeAreaView>
    </Flex>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
     backgroundColor: COLORS.background,
  },

  dateBadge: {
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  topStatsRow: {
    marginBottom: 24,
    marginHorizontal: 20,
  },
  gridContainer: {
    marginBottom: 16,
  },
  growthText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 8,
  },
  percentBadge: {
    backgroundColor: '#FFF8E1', // Light yellow

    borderRadius: 6,
  },
  percentText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '700',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  listSection: {
    marginBottom: 24,
  },
  viewAllButton: {
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.border,
    height: 50,
  },
});
