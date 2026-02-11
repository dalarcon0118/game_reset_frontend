import { PluginContext } from '@/shared/core/plugins/plugin.types';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FiltersPluginConfig {
  stateKey: string;
  eventName: string;
  defaultValue: string;
  options: FilterOption[];
}

export const defaultConfig: FiltersPluginConfig = {
  stateKey: 'statusFilter',
  eventName: 'dashboard:filter_changed',
  defaultValue: 'all',
  options: [
    { label: 'Abierto', value: 'open' },
    { label: 'Próximos', value: 'scheduled' },
    { label: 'Cerrado', value: 'closed' },
    { label: 'Premiados', value: 'rewarded' },
    { label: 'Todos', value: 'all' }
  ]
};

export interface Model {
  statusFilter: string;
  context: PluginContext | null;
  config: FiltersPluginConfig;
}

export const initialModel: Model = {
  statusFilter: defaultConfig.defaultValue,
  context: null,
  config: defaultConfig
};
