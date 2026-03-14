import { AuthRepository } from '@shared/repositories/auth';
import { apiClient } from '@shared/services/api_client';
import { TimerRepository } from '@shared/repositories/system/time';
import settings from '../../config/settings';
import { logger } from '@shared/utils/logger';
import { CoreMsg } from './msg';

const log = logger.withTag('CORE_SERVICE');

/**
 * CoreService
 * 
 * Encapsula la lógica imperativa de inicialización y orquestación del sistema base.
 * Estas funciones son invocadas por el CoreModule mediante Cmd.task.
 */
export const CoreService = {
  /**
   * Inicializa la infraestructura base (Middlewares y Engine).
   * La configuración del motor ahora es síncrona en bootstrap.ts.
   * Retorna true si existe una sesión activa tras la hidratación.
   */
  async initializeInfrastructure(): Promise<boolean> {
    // 1. Configurar dependencias globales del API Client (Inyección Explícita)
    apiClient.config({
      settings,
      log: logger.withTag('API_CLIENT'),
      timeSync: TimerRepository,
      timeIntegrity: TimerRepository,
      tokenStorageGetter: () => AuthRepository
    });

    // La infraestructura base (Engine, Middlewares) se configura
    // automáticamente vía side-effect import en el CoreModule.

    // 2. Verificar estado inicial de la sesión mediante hidratación
    const user = await AuthRepository.hydrate();
    return !!user;
  },

  /**
   * Cierra la sesión globalmente.
   */
  async logout(): Promise<void> {
    await AuthRepository.logout();
  },

  /**
   * Configura los handlers globales de error y expiración del API Client.
   */
  async setupApiHandlers(dispatch: (msg: CoreMsg) => void): Promise<void> {
    // Escuchar expiraciones desde el API Client (CredentialProvider)
    apiClient.setSessionExpiredHandler(() => {
      // Notificamos al repositorio para que emita la señal global
      AuthRepository.notifySessionExpired('API_CLIENT_REFRESH_FAILED');
    });

    apiClient.setErrorHandler(async (error: any, endpoint: string) => {
      // Evitar bucles en endpoints críticos de auth
      if (endpoint.includes('/login') || endpoint.includes('/token')) return null;

      if (error.status === 401) {
        // Notificamos al repositorio para que emita la señal global
        AuthRepository.notifySessionExpired('UNAUTHORIZED_API_RESPONSE');
      }
      return null;
    });
  }
};
