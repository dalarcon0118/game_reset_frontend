import { AuthRepository } from '@shared/repositories/auth';
import { apiClient } from '@shared/services/api_client';
import { MiddlewareRegistry } from '@core/tea-utils/middleware_registry';
import { createLoggerMiddleware } from '@core/middlewares/logger.middleware';
import { createTimeIntegrityMiddleware } from '@core/middlewares/time-integrity-v2.middleware';
import { elmEngine } from '@core/engine/engine_config';
import { effectHandlers } from '@core/tea-utils/effect_handlers';
import { CoreMsg } from './msg';

/**
 * CoreService
 * 
 * Encapsula la lógica imperativa de inicialización y orquestación del sistema base.
 * Estas funciones son invocadas por el CoreModule mediante Cmd.task.
 */
export const CoreService = {
  /**
   * Inicializa la infraestructura base (Middlewares y Engine).
   * Retorna true si existe una sesión activa tras la hidratación.
   */
  async initializeInfrastructure(): Promise<boolean> {
    // 1. Configurar Infraestructura Base
    MiddlewareRegistry.register(createLoggerMiddleware());
    MiddlewareRegistry.register(createTimeIntegrityMiddleware());

    elmEngine.configure({
      effectHandlers,
      middlewares: MiddlewareRegistry.getGlobals()
    });

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
