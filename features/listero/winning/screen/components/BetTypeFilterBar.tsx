import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';

interface BetTypeFilterBarProps {
  selectedBetType: string;
  onBetTypeChange: (betType: string) => void;
  configuredBetTypes: string[];
}

export const BetTypeFilterBar: React.FC<BetTypeFilterBarProps> = ({
  selectedBetType,
  onBetTypeChange,
  configuredBetTypes,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const betTypes = ['all', ...configuredBetTypes];

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {betTypes.map((betType) => (
          <TouchableOpacity
            key={betType}
            style={[
              styles.filterButton,
              { 
                backgroundColor: selectedBetType === betType ? theme.primary : theme.primary + '20',
              }
            ]}
            onPress={() => onBetTypeChange(betType)}
          >
            <Text 
              style={[
                styles.filterText,
                { color: selectedBetType === betType ? '#FFFFFF' : theme.primary }
              ]}
            >
              {betType === 'all' ? 'Todos' : betType}
            </Text>
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BetTypeFilterBar;
