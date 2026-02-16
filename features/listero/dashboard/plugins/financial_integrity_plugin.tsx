import React from 'react';
import { FinancialIntegrityView } from './financial_integrity_plugin/view';
import { Plugin, SlotProps } from '@/shared/core/plugins/plugin.types';

const FinancialIntegrityPluginComponent: React.FC<SlotProps> = ({ context }) => {
  return <FinancialIntegrityView context={context} />;
};

const FinancialIntegrityPlugin: Plugin = {
  id: 'listero.dashboard.integrity-watchdog',
  name: 'Financial Integrity Watchdog',
  slots: {
    'dashboard.notifications': { // Lo inyectamos en un slot de notificaciones
      component: FinancialIntegrityPluginComponent,
      layout: {
        order: -1, // Queremos que aparezca arriba de todo si hay error
        fullWidth: true
      }
    }
  },
  version: '1.0.0'
};

export const FinancialIntegrityPluginExport = FinancialIntegrityPlugin;
export default FinancialIntegrityPlugin;
