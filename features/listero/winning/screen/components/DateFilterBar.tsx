import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

import { DateFilter } from '../../core/types';

interface DateFilterBarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string, filterType: DateFilter) => void;
}

/**
 * Barra de filtro de fechas para WinnersScreen
 * 
 * Permite filtrar por:
 * - Hoy (default)
 * - Ayer
 * - Esta semana
 * - Fecha específica (custom)
 */
export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  selectedDate,
  onDateChange
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [activeFilter, setActiveFilter] = useState<DateFilter>('all');

  // Calcular fechas
  const getDateForFilter = (filter: DateFilter): string => {
    const today = new Date();
    switch (filter) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      }
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return weekStart.toISOString().split('T')[0];
      }
      default:
        return today.toISOString().split('T')[0];
    }
  };

  const handleFilterPress = (filter: DateFilter) => {
    setActiveFilter(filter);
    const newDate = getDateForFilter(filter);
    onDateChange(newDate, filter);
  };

  // Formatear fecha para mostrar
  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const isToday = (dateStr: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isYesterday = (dateStr: string): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === yesterday.toISOString().split('T')[0];
  };

  // Color para texto activo: blanco en light, oscuro en dark
  const activeTextColor = colorScheme === 'dark' ? theme.background : '#FFFFFF';
  // Color para fondo inactivo
  const inactiveBgColor = theme.primaryLight;

  const renderFilterButton = (filter: DateFilter, label: string) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterButton,
          { backgroundColor: isActive ? theme.primary : inactiveBgColor }
        ]}
        onPress={() => handleFilterPress(filter)}
      >
        <Text 
          style={[
            styles.filterText,
            { color: isActive ? activeTextColor : theme.primary }
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {renderFilterButton('today', 'Hoy')}
        {renderFilterButton('yesterday', 'Ayer')}
        {renderFilterButton('week', 'Semana')}
        {renderFilterButton('all', 'Todos')}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filtersContainer: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  currentDateText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
  },
});

export default DateFilterBar;
