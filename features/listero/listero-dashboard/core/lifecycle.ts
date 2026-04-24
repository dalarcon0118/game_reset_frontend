import { useEffect } from 'react';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_LIFECYCLE');

/**
 * Hook para gestionar el ciclo de vida del dashboard.
 * 
 * - Al montar: Inicializa recursos
 * - Al desmontar: Limpia las suscripciones del store
 */
export const useDashboardLifecycle = (store: any) => {
    useEffect(() => {
        log.info('Dashboard Mounting: Initializing resources');
        
        return () => {
            log.info('Dashboard Unmounting: Cleaning up resources');
            
            if (store.getState().cleanup) {
                store.getState().cleanup();
            }
        };
    }, [store]);
};
