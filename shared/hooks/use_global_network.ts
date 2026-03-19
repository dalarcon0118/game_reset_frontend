import { storeRegistry } from '@/shared/core/engine/store_registry';
import { CoreModel } from '@/core/core_module/model';
import { CoreMsg } from '@/core/core_module/msg';

/**
 * Hook global para acceder al estado de red unificado (SSoT).
 * Consume el store del CoreModule registrado en el StoreRegistry.
 * 
 * @deprecated Use useGlobalNetwork instead for better architectural alignment.
 */
export const useGlobalNetwork = () => {
  // Obtenemos el store del CoreModule desde el registro global
  const coreStore = storeRegistry.get<any>('Core');
  
  if (!coreStore) {
    // Fallback seguro si el CoreModule no está listo
    return {
      isOnline: true,
      isPhysicalConnected: true,
      isServerReachable: true,
      connectivity: {
        isPhysicalConnected: true,
        isServerReachable: true,
        lastCheck: Date.now()
      }
    };
  }

  // Usamos el store de Zustand directamente
  const state = coreStore.getState();
  const model = state.model as CoreModel;

  return {
    isOnline: model.networkConnected,
    isPhysicalConnected: model.connectivity.isPhysicalConnected,
    isServerReachable: model.connectivity.isServerReachable,
    connectivity: model.connectivity
  };
};

/**
 * Hook compatible con la interfaz antigua para facilitar la migración.
 */
export const useNetwork = () => {
  const { isOnline } = useGlobalNetwork();
  return { isOnline };
};
