import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

type DateFilter = 'today' | 'yesterday' | 'week' | 'custom';

interface DateFilterBarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  onFilterChange?: (filter: DateFilter) => void;
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
  onDateChange,
  onFilterChange
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [activeFilter, setActiveFilter] = useState<DateFilter>('today');
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    onDateChange(newDate);
    onFilterChange?.(filter);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(current.toISOString().split('T')[0]);
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
              backgroundColor: activeFilter === 'custom' ? theme.primary : theme.primary + '20',
            }
          ]}
          onPress={() => {
            setShowDatePicker(!showDatePicker);
            setActiveFilter('custom');
          }}
        >
          <Calendar size={14} color={activeFilter === 'custom' ? '#FFFFFF' : theme.primary} />
          <Text 
            style={[
              styles.filterText,
              { color: activeFilter === 'custom' ? '#FFFFFF' : theme.primary, marginLeft: 4 }
            ]}
          >
            {formatDisplayDate(selectedDate)}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date navigation arrows when custom */}
      {activeFilter === 'custom' && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.background }]}
            onPress={() => navigateDate('prev')}
          >
            <ChevronLeft size={20} color={theme.text} />
          </TouchableOpacity>
          
          <Text style={[styles.currentDateText, { color: theme.text }]}>
            {formatDisplayDate(selectedDate)}
          </Text>
          
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.background }]}
            onPress={() => navigateDate('next')}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight 
              size={20} 
              color={isToday(selectedDate) ? theme.textTertiary : theme.text} 
            />
          </TouchableOpacity>
        </View>
      )}
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
