
import { NavigationPolicy } from '../../shared/navigation/navigation_policy.types';

export type SessionStatus = 'INITIAL' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'EXPIRED';

export type BootstrapStatus = 'IDLE' | 'INITIALIZING' | 'READY' | 'ERROR';

export interface CoreModel {
  /** Estado de inicialización de la infraestructura base (kernel, api, etc) */
  bootstrapStatus: BootstrapStatus;

  /** Estado global de la sesión sincronizado con AuthRepository */
  sessionStatus: SessionStatus;

  /** Estado del mantenimiento diario sincronizado con SystemJanitor */
  maintenanceStatus: { date: string; status: 'ready' } | null;

  /** Errores globales de infraestructura */
  error: string | null;

  /** Política de navegación inyectada por el kernel (Composition Root) */
  navigationPolicy: NavigationPolicy | null;

  /** Detalle de los sensores de conectividad */
  connectivity: {
    isPhysicalConnected: boolean; // Sensor Activo (NetInfo)
    isServerReachable: boolean;   // Sensor Pasivo (ApiClient/Ping)
    lastCheck: number;            // Timestamp para invalidación
  };

  /** Estado de conectividad global (SSoT Derivado) */
  networkConnected: boolean;

  /** Sistema completamente listo para operar (derivado de maintenanceStatus y sessionStatus) */
  isSystemReady: boolean;
}

export const initialModel: CoreModel = {
  bootstrapStatus: 'IDLE',
  sessionStatus: 'INITIAL',
  maintenanceStatus: null,
  error: null,
  navigationPolicy: null,
  connectivity: {
    isPhysicalConnected: true,
    isServerReachable: true,
    lastCheck: Date.now()
  },
  networkConnected: true, // Asumimos online por defecto hasta el primer evento
  isSystemReady: false,
};
