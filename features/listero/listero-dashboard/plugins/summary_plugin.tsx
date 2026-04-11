import React, { useEffect } from 'react';
import { SummaryComponent } from './summary_plugin/view';
import { Plugin, SlotProps } from '@core/plugins/plugin.types';
import { SummaryModule } from './summary_plugin/store';
import { logger } from '@/shared/utils/logger';

const SummaryPluginComponent: React.FC<SlotProps> = ({ context }) => {
  // 🛡️ ESTABILIZACIÓN DEL CONTEXTO: Extraemos solo las partes estáticas (funciones/servicios).
  // NO incluimos 'state' ni 'hostStore' en este objeto porque cambian cada segundo (TICK).
  // Al usar useMemo sin dependencias externas (solo context estable), initialParams
  // se mantendrá igual por siempre, evitando la recreación del Store TEA.
  const stableInitialParams = React.useMemo(() => {
    if (!context) return undefined;
    
    return {
      api: context.api,
      storage: context.storage,
      events: context.events,
      // 🛡️ REINYECTAR hostStore: Requerido por context.validator.ts.
      // Al extraerlo en este useMemo sin dependencias, la referencia será estable
      // y no provocará la recreación del Store TEA.
      hostStore: context.hostStore,
      // Pasamos el estado INICIAL solo para el arranque, 
      // las actualizaciones posteriores vendrán por Sub.watchStore.
      state: { ...context.state } 
    };
  }, [context]); // Re-calcular si el contexto cambia (estabilización inicial)

  return (
    <SummaryModule.Provider initialParams={stableInitialParams}>
      <SummaryComponent />
    </SummaryModule.Provider>
  );
};

const SummaryPlugin: Plugin = {
  id: 'listero.dashboard.summary',
  name: 'Dashboard Summary',
  slots: {
    'dashboard.summary': {
      component: SummaryPluginComponent,
      layout: {
        order: 0,
        fullWidth: true,
        minHeight: 200,
        useSkeleton: true
      }
    }
  },
  version: '1.0.0'
};

export const SummaryPluginExport = SummaryPlugin;
export default SummaryPlugin;
