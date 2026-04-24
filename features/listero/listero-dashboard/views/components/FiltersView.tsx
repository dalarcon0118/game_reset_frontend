import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Label } from '@/shared/components';
import { useDashboardStore } from '../../store';
import { SELECT_FILTER } from '../../core/msg';
import { styles } from '../../plugins/filters_plugin/styles';

const FILTER_OPTIONS = [
  { label: 'Abierto', value: 'open' },
  { label: 'Próximos', value: 'scheduled' },
  { label: 'Cerrado', value: 'closed' },
  { label: 'Premiados', value: 'rewarded' },
  { label: 'Todos', value: 'all' }
];

export const FiltersView: React.FC = () => {
  const model = useDashboardStore((state) => state.model);
  const dispatch = useDashboardStore((state) => state.dispatch);

  const handleFilterPress = (value: string) => {
    dispatch(SELECT_FILTER(value as any));
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => handleFilterPress(option.value)}
            style={[
              styles.filterTab,
              model.appliedFilter === option.value && styles.activeFilterTab
            ]}
          >
            <Label
              style={[
                styles.filterLabel,
                model.appliedFilter === option.value && styles.activeFilterLabel
              ]}
            >
              {option.label}
            </Label>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};