import React from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { withDataView } from '@shared/components';
import { ListeroHeader } from './components/ListeroHeader';
import { useDrawConfirmation } from './hooks/useDrawConfirmation';
import { useTheme } from '@shared/hooks/useTheme';
import { DateNavigation } from './components/DateNavigation';
import { DrawItem } from './components/DrawItem';
import { useDrawer } from './hooks/useDrawer';

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
  const { selectedDate
    , handleNavigate
    , refresh
    , details
    , loading
    , error
    , theme
    , handleReport
    ,router 
    ,setSelectedDate
    ,formatDateToString
  } = useDrawer({ id: Number(id) });


  const { confirmDraw } = useDrawConfirmation({
    onSuccess: refresh,
    details
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
