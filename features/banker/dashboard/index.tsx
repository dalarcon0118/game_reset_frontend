import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';

import { COLORS } from '../../../shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { useAuth } from '@/shared/context/AuthContext';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { StructureService, ChildStructure } from '@/shared/services/Structure';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { DashboardOperations } from './DashboardOperations';
import { BankHealth } from './BankHealth';
import { useTheme } from '@ui-kitten/components';

export default function BankerDashboardScreen() {
  const { user } = useAuth();
  const [fetchAgencies, agencies, isLoading] = useDataFetch<ChildStructure[], [number]>(StructureService.getChildren);
  const theme = useTheme();

  useEffect(() => {
    if (user?.structure?.id) {
      fetchAgencies(user.structure.id);
    }
  }, [user?.structure?.id]);

  const handleRefresh = () => {
    if (user?.structure?.id) {
      fetchAgencies(user.structure.id);
    }
  };

  return (
    <Flex vertical flex={1} background={theme['background-basic-color-1']} padding={[{type:"top", value:20}]}>
      <DashboardHeader isLoading={isLoading} onRefresh={handleRefresh} />
      <SafeAreaView style={styles.safeArea}>
        <DashboardStats agencies={agencies} />
        <BankHealth />
        <DashboardOperations agencies={agencies} isLoading={isLoading} onRefresh={handleRefresh} />
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
