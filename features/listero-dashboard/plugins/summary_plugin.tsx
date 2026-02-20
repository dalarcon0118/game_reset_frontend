import React from 'react';
import { SummaryComponent } from './summary_plugin/view';
import { Plugin, SlotProps } from '@/shared/core/plugins/plugin.types';

const SummaryPluginComponent: React.FC<SlotProps> = ({ context }) => {
  return <SummaryComponent context={context} />;
};

const SummaryPlugin: Plugin = {
  id: 'listero.dashboard.summary',
  name: 'Dashboard Summary',
  slots: {
    'dashboard.summary': {
      component: SummaryPluginComponent,
      layout: {
        order: 0,
        fullWidth: true
      }
    }
  },
  version: '1.0.0'
};

export const SummaryPluginExport = SummaryPlugin;
export default SummaryPlugin;