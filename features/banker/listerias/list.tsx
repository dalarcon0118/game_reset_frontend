import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@ui-kitten/components';
import { Flex, Label, withDataView } from '@/shared/components';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { StructureService, ChildStructure } from '@/shared/services/Structure';
import { BankerOperationCard } from '../components/BankerOperationCard';
import { useFinancialStore } from '@/shared/store/financial/store';
import { COLORS } from '@/shared/components/constants';
import { Header } from '../common/header';

interface AgencyDetailContentProps {
  childrenData: ChildStructure[] | null;
  onRefresh: () => void;
  loading: boolean;
}

function AgencyDetailContent({
  childrenData,
  onRefresh,
  loading
}: AgencyDetailContentProps) {
  const router = useRouter();

  return (
    <ScrollView 
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl 
          refreshing={loading} 
          onRefresh={onRefresh} 
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <Flex vertical gap={10}>
         {childrenData?.map((child) => (
            <BankerOperationCard
              key={child.id}
              nodeId={child.id}
              name={child.name}
              onPress={() => {
                  router.push({ pathname: '/banker/drawers/[id]', params: { id: child.id, title: child.name } });
              }}
               onReglamentoPress={() => router.push({ pathname: '/banker/rules', params: { id_structure: child.id } })}
            />
         ))}
      </Flex>
    </ScrollView>
  );
}

const DataBoundAgencyContent = withDataView(AgencyDetailContent);

export default function AgencyDetailsScreen() {
  const { id, title } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();

  const fetchChildren = useCallback(() => {
    return StructureService.getChildren(Number(id));
  }, [id]);

  const [fetchData, children, loading, error] = useDataFetch<ChildStructure[]>(fetchChildren);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (children && children.length > 0) {
      const nodeIds = children.map(c => c.id);
      useFinancialStore.getState().dispatch({ type: 'SYNC_NODES', nodeIds });
    }
  }, [children]);

  const handleRefresh = () => {
      fetchData();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]} edges={['top']}>
      <Header
        title={typeof title === 'string' ? title : 'Listas'}
        onBack={() => router.back()}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <DataBoundAgencyContent
        loading={loading}
        error={error}
        isEmpty={!children || children.length === 0}
        onRetry={handleRefresh}
        childrenData={children}
        onRefresh={handleRefresh}
        emptyMessage="No hay listeros para mostrar."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
