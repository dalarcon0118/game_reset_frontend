import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { withDataView } from '@/shared/components';
import { ListeroDetails } from '@/shared/services/structure';
import { useTheme } from '@/shared/hooks/use_theme';
import { DateNavigation } from '@/features/colector/drawers/views/date_navigation';
import { DrawItem } from '@/features/colector/drawers/views/draw_item';
import { Header } from '../common/header';
import { useDrawer } from './hook/use_drawer';

const formatDateToString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

interface ListeroDetailContentProps {
  details: ListeroDetails | null;
  onRefresh: () => void;
  onReport: (drawId: number) => void;
  onConfirm: (drawId: number) => void;
  loading: boolean;
}

function ListeroDetailContent({
  details,
  onRefresh,
  onReport,
  onConfirm,
  loading
}: ListeroDetailContentProps) {
  const { spacing } = useTheme();

  return (
    <ScrollView 
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={
        <RefreshControl 
          refreshing={loading} 
          onRefresh={onRefresh} 
        />
      }
    >
      {details?.draws?.map((draw) => (
        <DrawItem
          key={draw.draw_id}
          draw={draw}
          onConfirm={onConfirm}
          onReport={onReport}
        />
      ))}
    </ScrollView>
  );
}

const DataBoundListeroContent = withDataView(ListeroDetailContent);

export default function DrawerScreen() {
  const { id, title } = useLocalSearchParams();
  const theme = useTheme();
  
  const {
    selectedDate,
    setSelectedDate,
    handleNavigate,
    handleBack,
    handleReport,
    confirmDraw,
    refresh,
    details,
    loading,
    error,
  } = useDrawer({ id: Number(id) });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']}>
        <Header 
          title={`Sorteo ${details?.listero_name || '' }`} 
          onBack={handleBack}
          onRefresh={refresh}
        />
      </SafeAreaView>
      
      <DateNavigation
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onNavigate={handleNavigate}
      />

      <DataBoundListeroContent
        loading={loading}
        error={error}
        isEmpty={!details?.draws || details.draws.length === 0}
        onRetry={refresh}
        details={details}
        onRefresh={refresh}
        onReport={handleReport}
        onConfirm={confirmDraw}
        emptyMessage={`No hay sorteos para mostrar el ${formatDateToString(selectedDate)}.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
