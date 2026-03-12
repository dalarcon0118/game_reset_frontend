
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
}

export const initialModel: CoreModel = {
  bootstrapStatus: 'IDLE',
  sessionStatus: 'INITIAL',
  networkConnected: true,
  error: null,
};
