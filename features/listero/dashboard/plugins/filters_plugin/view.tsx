import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Label } from '@/shared/components';
import { PluginContext } from '@/shared/core/plugins/plugin.types';
import { useFiltersPluginStore } from './store';
import { SELECT_FILTER } from './msg';
import { styles } from './styles';
import { FiltersPluginConfig } from './model';

interface FiltersComponentProps {
  context: PluginContext;
  config: FiltersPluginConfig;
}

export const FiltersComponent: React.FC<FiltersComponentProps> = ({ context, config }) => {
  const { model, dispatch, init } = useFiltersPluginStore();

  if (!model.context || model.context?.hostStore !== context.hostStore || model.config !== config) {
    init({ context, config });
  }

  const handleFilterPress = (value: string) => {
    dispatch(SELECT_FILTER(value));
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {config.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => handleFilterPress(option.value)}
            style={[
              styles.filterTab,
              model.statusFilter === option.value && styles.activeFilterTab
            ]}
          >
            <Label
              style={[
                styles.filterLabel,
                model.statusFilter === option.value && styles.activeFilterLabel
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
