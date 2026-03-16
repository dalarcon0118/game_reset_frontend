
import { NavigationPolicy } from '../../shared/navigation/navigation_policy.types';

export type SessionStatus = 'INITIAL' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'EXPIRED';

export type BootstrapStatus = 'IDLE' | 'INITIALIZING' | 'READY' | 'ERROR';

export interface CoreModel {
  /** Estado de inicialización de la infraestructura base (kernel, api, etc) */
  bootstrapStatus: BootstrapStatus;

  /** Estado global de la sesión sincronizado con AuthRepository */
  sessionStatus: SessionStatus;

  /** Estado de conectividad de red */
  networkConnected: boolean;

  /** Errores globales de infraestructura */
  error: string | null;

  /** Indica si el mantenimiento diario ha terminado */
  isMaintenanceReady: boolean;

  /** Indica si el perfil de usuario y contexto de sesión están completamente cargados */
  isProfileReady: boolean;

  /** Indica si TODO el sistema está listo para operar (mantenimiento + perfil) */
  isSystemReady: boolean;

  /** Política de navegación inyectada por el kernel (Composition Root) */
  navigationPolicy: NavigationPolicy | null;
}

export const initialModel: CoreModel = {
  bootstrapStatus: 'IDLE',
  sessionStatus: 'INITIAL',
  networkConnected: true,
  error: null,
  isMaintenanceReady: false,
  isProfileReady: false,
  isSystemReady: false,
  navigationPolicy: null,
};
