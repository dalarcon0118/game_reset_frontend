
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

  /** Forzado manual de modo offline (para tests o depuración) */
  isOffline: boolean;

  /** Estado de conectividad global (SSoT Derivado) */
  networkConnected: boolean;

  /** Indica si el perfil y estructura del usuario han sido verificados después del login */
  isSessionContextVerified: boolean;

  /** Indica si se está realizando la verificación del contexto de sesión (feedback UI) */
  isVerifyingSession: boolean;

  /** Contexto verificado del usuario (perfil, estructuraId, etc) */
  userContext: { structureId: string; user: any } | null;

  /** Sistema completamente listo para operar (derivado de maintenanceStatus y sessionStatus) */
  isSystemReady: boolean;
}

export const initialModel: CoreModel = {
  bootstrapStatus: 'IDLE',
  sessionStatus: 'INITIAL',
  isSessionContextVerified: false,
  isVerifyingSession: false,
  userContext: null,
  maintenanceStatus: null,
  error: null,
  navigationPolicy: null,
  connectivity: {
    isPhysicalConnected: true,
    isServerReachable: true,
    lastCheck: Date.now()
  },
  isOffline: false,
  networkConnected: true, // Asumimos online por defecto hasta el primer evento
  isSystemReady: false,
};
