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

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      {/* Filter buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: activeFilter === 'today' ? theme.primary : theme.primary + '20',
            }
          ]}
          onPress={() => handleFilterPress('today')}
        >
          <Text 
            style={[
              styles.filterText,
              { color: activeFilter === 'today' ? '#FFFFFF' : theme.primary }
            ]}
          >
            Hoy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: activeFilter === 'yesterday' ? theme.primary : theme.primary + '20',
            }
          ]}
          onPress={() => handleFilterPress('yesterday')}
        >
          <Text 
            style={[
              styles.filterText,
              { color: activeFilter === 'yesterday' ? '#FFFFFF' : theme.primary }
            ]}
          >
            Ayer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: activeFilter === 'week' ? theme.primary : theme.primary + '20',
            }
          ]}
          onPress={() => handleFilterPress('week')}
        >
          <Text 
            style={[
              styles.filterText,
              { color: activeFilter === 'week' ? '#FFFFFF' : theme.primary }
            ]}
          >
            Semana
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: activeFilter === 'all' ? theme.primary : theme.primary + '20',
            }
          ]}
          onPress={() => handleFilterPress('all')}
        >
          <Text 
            style={[
              styles.filterText,
              { color: activeFilter === 'all' ? '#FFFFFF' : theme.primary }
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>
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
