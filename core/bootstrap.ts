import { elmEngine } from '@core/engine/engine_config';
import { effectHandlers } from '@core/tea-utils/effect_handlers';
import { MiddlewareRegistry } from '@core/tea-utils/middleware_registry';
import { createLoggerMiddleware } from '@core/middlewares/logger.middleware';
import { settings } from '@/config/settings';
import { logger } from '@shared/utils/logger';
import { apiClient } from '@shared/services/api_client';
import { AuthRepository } from '@shared/repositories/auth';
import { deviceRepository } from '@shared/repositories/system/device';
import { setAuthRepository, CoreService } from './core_module/service';
import { appStateService } from './core_module/app_state.service';
import { sessionLockMediator } from './core_module/services/session-lock.mediator';
import { offlineStorage } from '@/shared/core/offline-storage/storage';
import { TimerRepository } from '@/shared/repositories/system/time';
import { RepositoriesModule } from '@/shared/repositories';

const log = logger.withTag('BOOTSTRAP');

/**
 * Bootstrapping de infraestructura base del motor TEA.
 * Este archivo se importa como side-effect en el punto de entrada
 * del sistema (CoreModule) para garantizar que el motor esté
 * configurado ANTES de que cualquier store intente usarlo.
 */

// 1. Configuración de dependencias externas (Imperative Shell)
// Esto asegura que los servicios base (API, Auth, Logs) estén listos
// antes de que el motor reactivo intente usarlos.
const bootstrapInfrastructure = () => {
  const log = logger.withTag('BOOTSTRAP');

  try {
    // A. Configurar API Client con settings, logger e identidad de dispositivo
    apiClient.config({
      settings,
      log: logger.withTag('API_CLIENT'),
      deviceIdProvider: () => deviceRepository.getUniqueId(),
      timeSync: TimerRepository,
      timeIntegrity: TimerRepository
    });
    log.debug('API Client configured with Device Identity Provider');

    // B. Inyectar AuthRepository en CoreService (Composition Root)
    setAuthRepository(AuthRepository);
    log.debug('AuthRepository injected into CoreService');

    // C. Inicializar AppState Service
    appStateService.start({
      getAuthRepository: () => AuthRepository,
      onSessionExpired: (reason) => {
        log.warn('Session expired detected by AppStateService', { reason });
      }
    });
    log.debug('AppStateService started');

    // D. SessionLockMediator es un singleton listo para usar (sin inicialización)

    // E. OfflineStorage ya está configurado por constructor (commonPorts)
    // No requiere inicialización adicional
    log.debug('OfflineStorage ready (configured via constructor)');

    // F. Registrar módulos de repositories
    RepositoriesModule.init();
    log.debug('RepositoriesModule initialized');

  } catch (error) {
    log.error('Error during infrastructure bootstrap', error);
  }
};

// 2. Configuración del Motor TEA (Motor Reactivo)
// Aquí se registran los effect handlers globales, middlewares, etc.
const bootstrapEngine = () => {
  const log = logger.withTag('ENGINE_BOOTSTRAP');

  try {
    // A. Configurar effect handlers globales via elmEngine.configure()
    elmEngine.configure({
      effectHandlers,
      middlewares: []
    });
    log.debug('Global effect handlers registered via elmEngine.configure()');

    // B. Registrar middlewares globales
    const globalMiddlewares = [
      createLoggerMiddleware({ enableDebug: __DEV__ })
    ];
    globalMiddlewares.forEach(m => MiddlewareRegistry.register(m));
    log.debug('Global middlewares registered', { count: globalMiddlewares.length });

  } catch (error) {
    log.error('Error during engine bootstrap', error);
  }
};

// 3. Ejecución del bootstrap (Side-effect)
// Se ejecuta inmediatamente al importar este archivo
bootstrapInfrastructure();
bootstrapEngine();

log.info('Bootstrap completed: Infrastructure + Engine ready');