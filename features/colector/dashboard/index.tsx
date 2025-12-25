import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';

import { COLORS } from '../../../shared/components/constants';
import { Flex } from '../../../shared/components/flex';
import { useAuth } from '@/shared/context/AuthContext';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { StructureService, ChildStructure } from '@/shared/services/Structure';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { DashboardOperations } from './DashboardOperations';
import { useTheme } from '@ui-kitten/components';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [fetchChildren, children, isLoading] = useDataFetch<ChildStructure[], [number]>(StructureService.getChildren);
    const theme = useTheme();
  

  useEffect(() => {
    if (user?.structure?.id) {
      fetchChildren(user.structure.id);
    }
  }, [user?.structure?.id]);



  const handleRefresh = () => {
    if (user?.structure?.id) {
      fetchChildren(user.structure.id);
    }
  };

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
