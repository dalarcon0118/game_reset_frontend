import React from 'react';
import { FiltersComponent } from './filters_plugin/view';
import { Plugin, SlotProps } from '@core/plugins/plugin.types';
import { defaultConfig } from './filters_plugin/model';
import { FiltersPluginModule } from './filters_plugin/store';

const FiltersPluginComponent: React.FC<SlotProps> = ({ context }) => {
  // 🛡️ ESTABILIZACIÓN DEL CONTEXTO:
  // Evitamos que el Store TEA se recree en cada render del Dashboard (TICK).
  const stableInitialParams = React.useMemo(() => {
    if (!context) return undefined;
    return {
      context: {
        api: context.api,
        storage: context.storage,
        events: context.events,
        hostStore: context.hostStore,
        state: { ...context.state }
      },
      config: defaultConfig
    };
  }, []); // Dependencias vacías = Referencia estable durante toda la vida del plugin.

  return (
    <FiltersPluginModule.Provider initialParams={stableInitialParams}>
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
