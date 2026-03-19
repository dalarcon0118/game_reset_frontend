import React, { useEffect, useRef } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Label } from '@/shared/components';
import { PluginContext } from '@core/plugins/plugin.types';
import { FiltersPluginModule, selectModel, selectDispatch } from './store';
import { Msg, INIT_CONTEXT, SELECT_FILTER } from './msg';
import { styles } from './styles';
import { FiltersPluginConfig } from './model';

interface FiltersComponentProps {
  context: PluginContext;
  config: FiltersPluginConfig;
}

export const FiltersComponent: React.FC<FiltersComponentProps> = ({ context, config }) => {
  const model = FiltersPluginModule.useStore(selectModel);
  const dispatch = FiltersPluginModule.useStore(selectDispatch);
  
  const initializedRef = useRef(false);

  // Initialize context when available
  useEffect(() => {
    if (context && !initializedRef.current) {
      initializedRef.current = true;
      dispatch(INIT_CONTEXT({ context, config }) as Msg);
    }
  }, [context, config, dispatch]);

  const handleFilterPress = (value: string) => {
    dispatch(SELECT_FILTER(value) as Msg);
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
