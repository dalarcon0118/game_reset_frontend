import React from 'react';
import { FiltersComponent } from './filters_plugin/view';
import { Plugin, SlotProps } from '@/shared/core/plugins/plugin.types';
import { defaultConfig } from './filters_plugin/model';

const FiltersPluginComponent: React.FC<SlotProps> = ({ context }) => {
  return <FiltersComponent context={context} config={defaultConfig} />;
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
