import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { withDataView } from '@shared/components';
import { ListeroHeader, DateNavigation, DrawItem } from '../views';
import { useDrawConfirmation } from '../hooks/useDrawConfirmation';
import { useTheme } from '@shared/hooks/useTheme';
import { useDrawersStore } from '../core';
import { SET_SELECTED_DATE, REFRESH_CLICKED, NAVIGATE_BACK, REPORT_CLICKED, CONFIRM_DRAW, NAVIGATE_DATE } from '../core/msg';
import { ListeroDetails } from '@/shared/services/Structure';
import { RemoteData } from '@/shared/core/remote.data';

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
      contentContainerStyle={{ 
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl
      }}
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

const formatDateToString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export default function ListeroDetailScreen() {
  const { id, title } = useLocalSearchParams();
  const { model, dispatch, init } = useDrawersStore();
  const theme = useTheme();

  useEffect(() => {
    init({ id: Number(id) });
  }, [init, id]);

  const handleNavigate = (days: number) => {
    dispatch(NAVIGATE_DATE(days));
  };

  const handleRefresh = () => {
    dispatch(REFRESH_CLICKED());
  };

  const handleReport = (drawId: number) => {
    dispatch(REPORT_CLICKED(drawId));
  };

  const { confirmDraw } = useDrawConfirmation({
    onSuccess: handleRefresh,
    details: RemoteData.withDefault(null, model.details)
  });

  const loading = model.details.type === 'Loading';
  const details = RemoteData.withDefault(null, model.details);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <ListeroHeader
        title={title as string}
        onBack={() => dispatch(NAVIGATE_BACK())}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Date Selector */}
      <DateNavigation
        selectedDate={model.selectedDate}
        onDateChange={(date) => dispatch(SET_SELECTED_DATE(date))}
        onNavigate={handleNavigate}
      />

      <DataBoundListeroContent
        loading={loading}
        error={null} // TODO: handle error
        isEmpty={!details?.draws || details.draws.length === 0}
        onRetry={handleRefresh}
        details={details}
        onRefresh={handleRefresh}
        onReport={handleReport}
        onConfirm={confirmDraw}
        emptyMessage={`No hay sorteos para mostrar el ${formatDateToString(model.selectedDate)}.`}
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
