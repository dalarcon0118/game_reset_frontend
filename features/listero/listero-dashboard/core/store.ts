/**
 * Listero Dashboard Store
 * 
 * ⚠️ IMPORTANTE: Este archivo re-exporta desde store_context.tsx
 * para mantener compatibilidad con componentes existentes.
 * 
 * El store real se crea dentro del ListeroDashboardProvider,
 * lo que evita la inicialización prematura durante la importación del módulo.
 * 
 * Para usar este store, el componente debe estar dentro de ListeroDashboardProvider.
 * Ver: app/lister/(tabs)/dashboard.tsx
 */

import {
    ListeroDashboardProvider,
    useListeroDashboardStore,
    useListeroDashboardStoreApi,
    selectDashboardModel,
    selectDashboardDispatch
} from './store_context';

// Re-export everything con nombres originales
export {
    ListeroDashboardProvider,
    useListeroDashboardStore,
    useListeroDashboardStoreApi,
    selectDashboardModel,
    selectDashboardDispatch
};

// Alias para compatibilidad hacia atrás - usando named export
export { useListeroDashboardStore as useDashboardStore };
export { selectDashboardModel as selectModel };
export { selectDashboardDispatch as selectDispatch };
