import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Label } from '@/shared/components';
import { PluginContext } from '@/shared/core/plugins/plugin.types';
import { useFiltersPluginStore } from './store';
import { INIT_CONTEXT, SELECT_FILTER, SYNC_STATUS_FILTER } from './msg';
import { styles } from './styles';
import { FiltersPluginConfig } from './model';

interface FiltersComponentProps {
  context: PluginContext;
  config: FiltersPluginConfig;
}

export const FiltersComponent: React.FC<FiltersComponentProps> = ({ context, config }) => {
  const { model, dispatch } = useFiltersPluginStore();
  const hostStatusFilter = context.state?.[config.stateKey] ?? config.defaultValue;

  React.useEffect(() => {
    if (!model.context || model.config !== config) {
      dispatch(INIT_CONTEXT({ context, config }));
    }
  }, [context, dispatch, model.config, model.context, config]);

  React.useEffect(() => {
    if (model.statusFilter !== hostStatusFilter) {
      dispatch(SYNC_STATUS_FILTER(hostStatusFilter));
    }
  }, [dispatch, hostStatusFilter, model.statusFilter]);

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
