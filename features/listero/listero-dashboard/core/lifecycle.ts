import { useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_LIFECYCLE');

/**
 * Hook para gestionar el ciclo de vida del dashboard.
 * 
 * - Al montar: Inicializa recursos
 * - Al enfocar: Restaura el foco de la interfaz
 * - Al desmontar: Limpia las suscripciones del store
 */
export const useDashboardLifecycle = (store: any) => {
    // Cleanup on unmount
    useEffect(() => {
        log.info('Dashboard Mounting: Initializing resources');
        
        return () => {
            log.info('Dashboard Unmounting: Cleaning up resources');
            
            if (store.getState().cleanup) {
                store.getState().cleanup();
            }
        };
    }, [store]);

    // Focus management: Ensure interface is interactive when screen comes into focus
    useFocusEffect(() => {
        const state = store.getState();
        const model = state.model;
        
        log.info('[LIFECYCLE] Dashboard focused', { 
            status: model?.status?.type,
            hasStructureId: !!model?.userStructureId 
        });
        
        // If dashboard is ready, ensure no modal is blocking interaction
        if (model?.status?.type === 'READY') {
            // Close any accidentally opened promotion modal
            if (model.promotion?.showPromotionsModal) {
                log.info('[LIFECYCLE] Closing promotion modal on focus to restore interaction');
                state.dispatch({ type: 'PROMOTION_MSG', msg: { type: 'CLOSE_PROMOTIONS_MODAL' } });
            }
        }
    });
};
