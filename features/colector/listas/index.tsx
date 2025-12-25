import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Flex, Label, withDataView } from '@shared/components';
import { ListeroHeader } from './components/ListeroHeader';
import { useDrawConfirmation } from './hooks/useDrawConfirmation';
import { useDataFetch } from '@shared/hooks/useDataFetch';
import { StructureService, ListeroDetails } from '@shared/services/Structure';
import { DrawService } from '@shared/services/Draw';
import { useTheme } from '@shared/hooks/useTheme';
import { DateNavigation } from './components/DateNavigation';
import { DrawItem } from './components/DrawItem';

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

export default function ListeroDetailScreen() {
  const { id, title } = useLocalSearchParams();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleReport = useCallback((drawId: number) => {
    router.push({
      pathname: '/colector/reports/form',
      params: { id: String(id), drawId: String(drawId) }
    });
  }, [id, router]);

  const fetchDetails = useCallback(() => {
    return StructureService.getListeroDetails(Number(id), formatDateToString(selectedDate));
  }, [id, selectedDate]);

  const { isAuthenticated } = useAuth();
  const [refresh, details, loading, error] = useDataFetch<ListeroDetails>(fetchDetails);

  useEffect(() => {
    if (id && isAuthenticated) {
      refresh();
    }
  }, [id, selectedDate, refresh, isAuthenticated]);

  const handleNavigate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate > new Date()) return;
    setSelectedDate(newDate);
  };

  const { confirmDraw } = useDrawConfirmation({
    onSuccess: refresh,
    details
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ListeroHeader
        title={title}
        onBack={() => router.back()}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Date Selector */}
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
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dateSelector: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    padding: 8,
  },
  drawCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  }
});
