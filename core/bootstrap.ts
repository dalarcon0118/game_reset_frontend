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
import { offlineStorage } from '@/shared/core/offline-storage/storage';
import { TimerRepository } from '@/shared/repositories/system/time';
import { RepositoriesModule } from '@/shared/repositories';


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

        // C. Inicializar el checker de condiciones offline
        CoreService.initializeOfflineConditionChecker();
        log.debug('Offline condition checker initialized');

    } catch (error) {
        log.error('Critical failure during infrastructure bootstrap', error);
        throw error; // Fail fast si la infraestructura no puede arrancar
    }
};

RepositoriesModule.init();
// 2. Ejecutar bootstrap de infraestructura
bootstrapInfrastructure();

// 3. Registro de Middlewares Globales
MiddlewareRegistry.register(createLoggerMiddleware());

// 4. Configuración Síncrona del Motor
elmEngine.configure({
    effectHandlers,
    middlewares: MiddlewareRegistry.getGlobals()
});
offlineStorage.configure({
    clock: {
        now: () => TimerRepository.getTrustedNow(Date.now()),
        iso: () => new Date(TimerRepository.getTrustedNow(Date.now())).toISOString()
    }
});
console.log('[BOOTSTRAP] 🚀 Infraestructura base configurada (Synchronous)');
