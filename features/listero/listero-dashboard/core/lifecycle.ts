import { useEffect } from 'react';
import { registerDashboardPlugins, unregisterDashboardPlugins } from '../plugins/plugin-registrar';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_LIFECYCLE');

/**
 * Hook para gestionar el ciclo de vida del dashboard.
 * 
 * - Al montar: Registra los plugins.
 * - Al desmontar: Limpia las suscripciones del store y desregistra los plugins.
 * 
 * @param store El store de Zustand del dashboard que contiene el método cleanup()
 */
export const useDashboardLifecycle = (store: any) => {
    useEffect(() => {
        log.info('Dashboard Mounting: Initializing plugins and resources');
        
        // Inicializar plugins
        registerDashboardPlugins(store);

        return () => {
            log.info('Dashboard Unmounting: Cleaning up resources');
            
            // 1. Limpiar suscripciones del motor TEA (Intervalos, SSE, WATCH_STORE)
            if (store.getState().cleanup) {
                store.getState().cleanup();
            }

            // 2. Liberar plugins del PluginManager (Eliminar referencias circulares)
            unregisterDashboardPlugins();
        };
    }, [store]);
};
