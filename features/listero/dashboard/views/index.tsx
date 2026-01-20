import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import DrawItem from './DrawItem';
import Header from './Header';
import GlobalSummary from './GlobalSummary';
import { Label, Flex } from '@/shared/components';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  const {
    draws,
    summary,
    dailyTotals,
    statusFilter,
    commissionRate,
    setStatusFilter,
    refresh,
    goToRules,
    goToRewards,
    goToBetsList,
    goToCreateBet,
    goToError
  } = useDashboard();

  useEffect(() => {
    const isAuthError = (error: any) => error?.status === 401 || error?.status === 403;
    
    if ((draws.error && !isAuthError(draws.error)) || (summary.error && !isAuthError(summary.error))) {
      goToError();
    }
  }, [draws.error, summary.error, goToError]);

  if (draws.error || summary.error) {
    return null;
  }

  if (draws.loading && !draws.data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const filterOptions = [
    { label: 'Abierto', value: 'open' as const },
    { label: 'Cerrado', value: 'closed' as const },
    { label: 'Premiados', value: 'rewarded' as const },
     { label: 'Todos', value: 'all' as const }
  ];

  const renderFilterOptions = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.filtersContainer}
    >
      {filterOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => setStatusFilter(option.value)}
          style={[
            styles.filterTab,
            statusFilter === option.value && styles.activeFilterTab
          ]}
        >
          <Label 
            style={[
              styles.filterLabel,
              statusFilter === option.value && styles.activeFilterLabel
            ]}
          >
            {option.label}
          </Label>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header onRefresh={refresh} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[1]}
      >
        <GlobalSummary totals={dailyTotals} commissionRate={commissionRate} />
        
        <Flex style={styles.filtersWrapper}>
          {renderFilterOptions()}
        </Flex>

        <View style={styles.content}>
          <Flex justify="between" align="center" style={styles.sectionHeader}>
            <Label style={styles.sectionTitle}>Sorteos</Label>
            <Label type="detail" style={styles.drawCount}>
              {draws.data?.length || 0} disponibles
            </Label>
          </Flex>

          {draws.data?.map((draw, index) => (
            <DrawItem
              key={draw.id}
              draw={draw}
              index={index}
              onPress={goToRules}
              onRewardsPress={goToRewards}
              onBetsListPress={goToBetsList}
              onCreateBetPress={goToCreateBet}
            />
          ))}

          {draws.loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00C48C" />
              <Label style={styles.loadingText}>Actualizando sorteos...</Label>
            </View>
          )}

          {!draws.loading && draws.data?.length === 0 && (
            <View style={styles.emptyContainer}>
              <Label style={styles.emptyText}>No hay sorteos para mostrar</Label>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filtersWrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9F2',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  activeFilterTab: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  filterLabel: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  activeFilterLabel: {
    color: '#FFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E3A59',
  },
  drawCount: {
    fontSize: 12,
    color: '#8F9BB3',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8F9BB3',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    color: '#00C48C',
    fontSize: 14,
    fontWeight: '500',
  },
});