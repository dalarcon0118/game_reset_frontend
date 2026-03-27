import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button, Text } from '@ui-kitten/components';
import { withDataView } from '@/shared/components';
import { ListeroDrawDetail } from '@/shared/services/structure/types';
import { useTheme } from '@/shared/hooks/use_theme';
import { DateNavigation } from '@/features/colector/drawers/views/date_navigation';
import { DrawItem } from '@/features/colector/drawers/views/draw_item';
import { Header } from '../common/header';
import { useDrawConfirmation } from '@/features/colector/drawers/hooks/use_draw_confirmation';
import { TimePolicy } from '@/shared/repositories/system/time/time.update';
import { 
  DrawersStoreProvider,
  useDrawersDispatch,
  useDrawersStore,
  selectDrawersViewModel
} from './core';

interface FilterTopBarProps {
  statuses: { id: string; label: string }[];
  types: { id: string; label: string }[];
  currentStatus: string | null;
  currentType: string | null;
  onStatusChange: (status: string | null) => void;
  onTypeChange: (type: string | null) => void;
  onClear: () => void;
}

const FilterChip = React.memo(({ 
  label, 
  isSelected, 
  onPress, 
  colors, 
  spacing 
}: { 
  label: string; 
  isSelected: boolean; 
  onPress: () => void; 
  colors: any; 
  spacing: any; 
}) => {
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Filtrar por ${label}`}
      accessibilityHint={`Activa o desactiva el filtro para el estado ${label}`}
      android_ripple={{ color: colors.primary, borderless: false, radius: 44 }}
      style={({ pressed }) => [
        styles.filterChip,
        { 
          backgroundColor: isSelected ? colors.primary : colors.background,
          marginRight: spacing.xs,
          paddingHorizontal: spacing.sm,
          height: 32,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          borderColor: isSelected ? colors.primary : colors.border
        }
      ]}
    >
      <Text 
        allowFontScaling={true}
        style={{ 
          color: isSelected ? 'white' : colors.text,
          fontSize: 12,
          fontWeight: isSelected ? '700' : '500'
        }}
      >
        {(label || '').toUpperCase()}
      </Text>
    </Pressable>
  );
});
FilterChip.displayName = 'FilterChip';

function FilterTopBar({ 
  statuses, 
  types, 
  currentStatus, 
  currentType, 
  onStatusChange, 
  onTypeChange,
  onClear 
}: FilterTopBarProps) {
  const { spacing, colors } = useTheme();
  const hasFilters = currentStatus !== null || currentType !== null;

  const renderStatusItem = useCallback(({ item }: { item: { id: string; label: string } | null }) => (
    <FilterChip
      label={item ? item.label : 'TODOS'}
      isSelected={currentStatus === (item ? item.id : null)}
      onPress={() => onStatusChange(item ? item.id : null)}
      colors={colors}
      spacing={spacing}
    />
  ), [currentStatus, onStatusChange, colors, spacing]);

  const renderTypeItem = useCallback(({ item }: { item: { id: string; label: string } | null }) => (
    <FilterChip
      label={item ? item.label : 'TODOS'}
      isSelected={currentType === (item ? item.id : null)}
      onPress={() => onTypeChange(item ? item.id : null)}
      colors={colors}
      spacing={spacing}
    />
  ), [currentType, onTypeChange, colors, spacing]);

  return (
    <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        <View style={styles.filterRow}>
          <Text allowFontScaling={true} category="label" appearance="hint" style={{ marginRight: spacing.sm, width: 50, fontSize: 10 }}>ESTADO</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, ...statuses]}
            keyExtractor={(item) => item ? item.id : 'all-status'}
            renderItem={renderStatusItem}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={3}
          />
        </View>

        <View style={[styles.filterRow, { marginTop: spacing.sm }]}>
          <Text allowFontScaling={true} category="label" appearance="hint" style={{ marginRight: spacing.sm, width: 50, fontSize: 10 }}>TIPO</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, ...types]}
            keyExtractor={(item) => item ? item.id : 'all-type'}
            renderItem={renderTypeItem}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={3}
          />
        </View>
      </View>
      
      {hasFilters && (
        <Pressable 
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            onClear();
          }}
          accessibilityRole="button"
          accessibilityLabel="Limpiar todos los filtros"
          accessibilityHint="Elimina todos los filtros aplicados actualmente"
          android_ripple={{ color: colors.primary, borderless: true, radius: 20 }}
          style={({ pressed }) => [
            styles.clearButton, 
            { 
              paddingHorizontal: spacing.md, 
              paddingVertical: spacing.xs,
              height: 32,
              justifyContent: 'center',
              opacity: pressed ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            }
          ]}
        >
          <Text allowFontScaling={true} category="c2" status="primary">Limpiar filtros</Text>
        </Pressable>
      )}
    </View>
  );
}

interface ListeroDetailContentProps {
  groupedDraws: Record<string, ListeroDrawDetail[]>;
  onRefresh: () => void;
  onReport: (drawId: number) => void;
  onConfirm: (drawId: number) => void;
  onSetWinningNumber?: (drawId: number, winningNumber: string) => void;
  loading: boolean;
  hasFilteredDraws: boolean;
}

function ListeroDetailContent({
  groupedDraws,
  onRefresh,
  onReport,
  onConfirm,
  onSetWinningNumber,
  loading,
  hasFilteredDraws
}: ListeroDetailContentProps) {
  const { spacing, colors } = useTheme();

  // Aplanar los datos para FlatList: [Header, Item, Item, Header, Item...]
  const flatData = useMemo(() => {
    const data: ({ type: 'header'; title: string } | { type: 'item'; data: ListeroDrawDetail })[] = [];
    Object.entries(groupedDraws).forEach(([group, draws]) => {
      data.push({ type: 'header', title: group });
      draws.forEach(draw => {
        data.push({ type: 'item', data: draw });
      });
    });
    return data;
  }, [groupedDraws]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={[styles.groupHeader, { borderBottomColor: colors.border, marginTop: spacing.sm, backgroundColor: colors.surface }]}>
          <Text allowFontScaling={true} category="h6" style={[styles.groupHeaderText, { color: colors.text }]}>{item.title}</Text>
        </View>
      );
    }
    return (
      <DrawItem
        draw={item.data}
        onConfirm={onConfirm}
        onReport={onReport}
        onSetWinningNumber={onSetWinningNumber}
      />
    );
  }, [onConfirm, onReport, onSetWinningNumber, colors.border, spacing.sm]);

  const keyExtractor = useCallback((item: any, index: number) => 
    item.type === 'header' ? `h-${item.title}` : `i-${item.data.draw_id}-${index}`, []);

  const stickyHeaderIndices = useMemo(() => 
    flatData.reduce((acc: number[], item, index) => {
      if (item.type === 'header') acc.push(index);
      return acc;
    }, []), [flatData]);

  if (!hasFilteredDraws && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text allowFontScaling={true} appearance="hint">No hay sorteos que coincidan con el filtro.</Text>
        <Button 
          appearance="ghost" 
          size="small" 
          onPress={onRefresh}
          style={{ marginTop: spacing.md }}
        >
          Reintentar
        </Button>
      </View>
    );
  }

  return (
    <FlatList
      data={flatData}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ padding: spacing.md }}
      refreshControl={
        <RefreshControl 
          refreshing={loading} 
          onRefresh={onRefresh} 
        />
      }
      renderItem={renderItem}
      stickyHeaderIndices={stickyHeaderIndices}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true} // Performance optimization for large lists
    />
  );
}

const DataBoundListeroContent = withDataView(ListeroDetailContent);

export default function DrawerScreen() {
  const { id } = useLocalSearchParams();
  const initialParams = useMemo(() => ({ id: Number(id) }), [id]);

  return (
    <DrawersStoreProvider initialParams={initialParams}>
      <DrawerContent />
    </DrawersStoreProvider>
  );
}

function DrawerContent() {
  const theme = useTheme();
  const dispatch = useDrawersDispatch();
  const model = useDrawersStore((s: any) => s.model);
  const vm = useMemo(() => selectDrawersViewModel(model), [model]);

  const { confirmDraw } = useDrawConfirmation({
    onSuccess: () => dispatch({ type: 'REFRESH_CLICKED' }),
    details: vm.detailsData
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']}>
        <Header 
          title={vm.title} 
          onBack={() => dispatch({ type: 'NAVIGATE_BACK' })}
          onRefresh={() => dispatch({ type: 'REFRESH_CLICKED' })}
        />
      </SafeAreaView>
      
      <DateNavigation
        selectedDate={vm.selectedDate}
        onDateChange={(date) => {
          const prev = TimePolicy.formatLocalDate(vm.selectedDate);
          const next = TimePolicy.formatLocalDate(date);
          if (prev !== next) {
            dispatch({ type: 'SET_SELECTED_DATE', date });
          }
        }}
        onNavigate={(days) => dispatch({ type: 'NAVIGATE_DATE', days })}
      />

      <FilterTopBar
        statuses={vm.availableStatuses}
        types={vm.availableTypes}
        currentStatus={vm.currentStatusFilter}
        currentType={vm.currentTypeFilter}
        onStatusChange={(status) => dispatch({ type: 'SET_STATUS_FILTER', status })}
        onTypeChange={(drawType) => dispatch({ type: 'SET_TYPE_FILTER', drawType })}
        onClear={() => dispatch({ type: 'CLEAR_FILTERS' })}
      />

      <DataBoundListeroContent
        groupedDraws={vm.groupedDraws}
        hasFilteredDraws={vm.hasFilteredDraws}
        loading={vm.detailsState.type === 'Loading'}
        onRefresh={() => dispatch({ type: 'REFRESH_CLICKED' })}
        onReport={(drawId: number) => dispatch({ type: 'REPORT_CLICKED', drawId })}
        onConfirm={(drawId: number) => confirmDraw(drawId)}
        onSetWinningNumber={(drawId: number, winningNumber: string) => dispatch({ type: 'SET_WINNING_NUMBER', drawId, winningNumber })}
        onRetry={() => dispatch({ type: 'REFRESH_CLICKED' })}
        emptyMessage={vm.emptyMessage}
        // withDataView props
        error={vm.detailsState.type === 'Failure' ? vm.detailsState.error : null}
        isEmpty={vm.hasDraws === false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  clearButton: {
    alignSelf: 'flex-end',
  },
  groupHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  groupHeaderText: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
