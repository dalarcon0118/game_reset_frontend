import React from 'react';
import { FiltersComponent } from './filters_plugin/view';
import { Plugin, SlotProps } from '@core/plugins/plugin.types';
import { defaultConfig } from './filters_plugin/model';
import { FiltersPluginModule } from './filters_plugin/store';

const FiltersPluginComponent: React.FC<SlotProps> = ({ context }) => {
  return (
    <FiltersPluginModule.Provider initialParams={{ context, config: defaultConfig }}>
      <FiltersComponent context={context} config={defaultConfig} />
    </FiltersPluginModule.Provider>
  );
};

export const FiltersPlugin: Plugin = {
  id: 'listero.dashboard.filters',
  name: 'Dashboard Filters',
  slots: {
    'dashboard.filters': {
      component: FiltersPluginComponent,
      layout: {
        order: 1,
        fullWidth: true
      }
    }
  },
  exports: {
    events: [defaultConfig.eventName]
  }
};
