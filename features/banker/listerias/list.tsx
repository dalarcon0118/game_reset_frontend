import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@ui-kitten/components';
import { Flex, withDataView } from '@/shared/components';
import { ChildStructure } from '@/shared/services/Structure';
import { BankerOperationCard } from '../components/BankerOperationCard';
import { Header } from '../common/header';
import { useListerias } from './hook/useListerias';

interface AgencyDetailContentProps {
  childrenData: ChildStructure[] | null;
  onRefresh: () => void;
  loading: boolean;
  onListeriaPress: (id: number, name: string) => void;
  onReglamentoPress: (id: number) => void;
}

function AgencyDetailContent({
  childrenData,
  onRefresh,
  loading,
  onListeriaPress,
  onReglamentoPress
}: AgencyDetailContentProps) {
  const theme = useTheme();

  return (
    <ScrollView 
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl 
          refreshing={loading} 
          onRefresh={onRefresh} 
          colors={[theme['color-primary-500']]}
          tintColor={theme['color-primary-500']}
        />
      }
    >
      <Flex vertical gap={10}>
         {childrenData?.map((child) => (
            <BankerOperationCard
              key={child.id}
              nodeId={child.id}
              name={child.name}
              onPress={() => onListeriaPress(child.id, child.name)}
              onReglamentoPress={() => onReglamentoPress(child.id)}
            />
         ))}
      </Flex>
    </ScrollView>
  );
}

const DataBoundAgencyContent = withDataView(AgencyDetailContent);

export default function AgencyDetailsScreen() {
  const { id, title } = useLocalSearchParams();
  const theme = useTheme();

  const {
    listerias,
    loading,
    error,
    refresh,
    handleBack,
    handleListeriaSelected,
    handleRulesPressed
  } = useListerias({ id: Number(id) });

  return (
    <View style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      <SafeAreaView edges={['top']}>
        <Header
          title={typeof title === 'string' ? title : 'Listas'}
          onBack={handleBack}
          onRefresh={refresh}
          loading={loading}
        />
      </SafeAreaView>

      <DataBoundAgencyContent
        loading={loading}
        error={error}
        isEmpty={!listerias || listerias.length === 0}
        onRetry={refresh}
        childrenData={listerias}
        onRefresh={refresh}
        onListeriaPress={handleListeriaSelected}
        onReglamentoPress={handleRulesPressed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
