import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { withDataView } from '@/shared/components';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { StructureService, ListeroDetails } from '@/shared/services/Structure';
import { useTheme } from '@/shared/hooks/useTheme';
import { DateNavigation } from '@/features/colector/drawers/views/DateNavigation';
import { DrawItem } from '@/features/colector/drawers/views/DrawItem';
import { useDrawConfirmation } from '@/features/colector/drawers/hooks/useDrawConfirmation';
import { Header } from '../common/header';
import { useDrawer } from './hook/useDrawer';

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
 const {
  selectedDate,
  setSelectedDate,
  handleNavigate,
  handleReport,
  confirmDraw,
  refresh,
  details,
  loading,
  error,
  theme,
  router
 } = useDrawer({ id: Number(id) });

  return (
    <View style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      <SafeAreaView edges={['top']}>
        <Header 
          title={`Sorteo ${details?.listero_name || '' }`} 
          onBack={() => router.back()}
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
