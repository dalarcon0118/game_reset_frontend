import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { AllWinnersCard } from '../../screen/components/AllWinnersCard';
import { DateFilterBar } from '../../screen/components/DateFilterBar';
import { BetTypeFilterBar } from '../../screen/components/BetTypeFilterBar';
import { WinningRecordGroup, DateFilter } from './types';
import { useTodosStore, useTodosDispatch } from './store';

const WinnerCardSkeleton: React.FC<{ theme: any }> = ({ theme }) => (
  <View style={[skeletonStyles.card, { backgroundColor: theme.card }]}>
    <View style={skeletonStyles.headerRow}>
      <View style={[skeletonStyles.textSkeleton, skeletonStyles.titleSkeleton, { backgroundColor: theme.border }]} />
      <View style={[skeletonStyles.textSkeleton, skeletonStyles.subtitleSkeleton, { backgroundColor: theme.border }]} />
    </View>
    <View style={skeletonStyles.numbersContainer}>
      <View style={[skeletonStyles.textSkeleton, skeletonStyles.labelSkeleton, { backgroundColor: theme.border }]} />
      <View style={[skeletonStyles.numberSkeleton, { backgroundColor: theme.border }]} />
    </View>
    <View style={[skeletonStyles.metaSkeleton, { borderTopColor: theme.border }]}>
      <View style={[skeletonStyles.textSkeleton, skeletonStyles.smallSkeleton, { backgroundColor: theme.border }]} />
    </View>
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  textSkeleton: { borderRadius: 4 },
  titleSkeleton: { width: '50%', height: 20 },
  subtitleSkeleton: { width: '25%', height: 16 },
  numbersContainer: { alignItems: 'center', paddingVertical: 12 },
  labelSkeleton: { width: '30%', height: 14, marginBottom: 8 },
  numberSkeleton: { width: '60%', height: 32, borderRadius: 8 },
  metaSkeleton: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  smallSkeleton: { width: '40%', height: 12 },
});

export const TodosScreen: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  
  const dispatch = useTodosDispatch();
  const store = useTodosStore();
  const model = store?.model;
  
  const isLoading = model?.allWinners?.type === 'Loading' || model?.allWinners?.type === 'NotAsked';
  const hasError = model?.allWinners?.type === 'Failure';
  
  const filteredData = model?.filteredData || [];
  const selectedBetType = model?.betTypeFilter || 'all';
  const configuredBetTypes = model?.configuredBetTypes || [];
  const selectedDate = model?.selectedDate || '';
  
  const handleDateChange = (date: string, filterType: DateFilter) => {
    dispatch({ type: 'CHANGE_DATE_FILTER', payload: { date, filterType } });
  };
  
  const handleBetTypeChange = (betType: string) => {
    dispatch({ type: 'CHANGE_BET_TYPE_FILTER', payload: betType });
  };
  
  const handleRefresh = () => {
    dispatch({ type: 'REFRESH' });
  };
  
  const renderLoading = () => (
    <View style={styles.contentContainer}>
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Cargando resultados...</Text>
      <WinnerCardSkeleton theme={theme} />
      <WinnerCardSkeleton theme={theme} />
    </View>
  );
  
  const renderError = (_error: string) => (
    <View style={styles.centered}>
      <Info size={48} color={theme.error} />
      <Text style={[styles.errorText, { color: theme.error }]}>Error al cargar</Text>
    </View>
  );
  
  const renderEmpty = () => (
    <View style={styles.centered}>
      <Text style={styles.emptyTitle}>Sin resultados</Text>
    </View>
  );
  
  const renderContent = () => {
    if (isLoading) return renderLoading();
    if (hasError) return renderError('Error');
    
    return (
      <FlatList
        data={filteredData}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        keyExtractor={(item: any, index: number) => String(item.date) + '-' + String(index)}
        renderItem={({ item }: { item: WinningRecordGroup }) => (
          <AllWinnersCard recordGroup={item} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty()}
      />
    );
  };
  
  return (
    <View style={styles.container}>
      <DateFilterBar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />
      
      <BetTypeFilterBar
        selectedBetType={selectedBetType}
        onBetTypeChange={handleBetTypeChange}
        configuredBetTypes={configuredBetTypes}
      />
      
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  contentContainer: { padding: 16 },
  loadingText: { textAlign: 'center' },
  errorText: { textAlign: 'center' },
  emptyTitle: { textAlign: 'center' },
});