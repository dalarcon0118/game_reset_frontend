import { CoreModel } from '../model';
import { CoreMsg } from '../msg';
import { Return, ret, singleton } from '@core/tea-utils/return';
import { Cmd } from '@core/tea-utils/cmd';
import { CoreService } from '../service';

/**
 * Calcula el estado isSystemReady basado en mantenimiento y estado de sesión.
 * Sistema listo cuando el mantenimiento está completado y la sesión es AUTHENTICATED o UNAUTHENTICATED.
 */
export const calculateIsSystemReady = (model: CoreModel): boolean => {
  const hasMaintenance = model.maintenanceStatus?.status === 'ready';
  return hasMaintenance && (model.sessionStatus === 'AUTHENTICATED' || model.sessionStatus === 'UNAUTHENTICATED');
};

/**
 * Helper para actualizar el modelo y recalcular el estado del sistema.
 */
export const updateModel = (model: CoreModel, patch: Partial<CoreModel>): CoreModel => {
  const nextModel = { ...model, ...patch };
  return {
    ...nextModel,
    isSystemReady: calculateIsSystemReady(nextModel)
  };
};

/**
 * Calcula el SSoT de conectividad basándose en sensores y modo manual
 */
export const calculateNetworkStatus = (model: { connectivity: CoreModel['connectivity'], isOffline: boolean }): boolean => {
  if (model.isOffline) return false;
  return model.connectivity.isPhysicalConnected && model.connectivity.isServerReachable;
};
