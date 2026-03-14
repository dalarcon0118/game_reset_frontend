import { elmEngine } from '@core/engine/engine_config';
import { effectHandlers } from '@core/tea-utils/effect_handlers';
import { MiddlewareRegistry } from '@core/tea-utils/middleware_registry';
import { createLoggerMiddleware } from '@core/middlewares/logger.middleware';

/**
 * Bootstrapping de infraestructura base del motor TEA.
 * Este archivo se importa como side-effect en el punto de entrada
 * del sistema (CoreModule) para garantizar que el motor esté
 * configurado ANTES de que cualquier store intente usarlo.
 */

// 1. Registro de Middlewares Globales
MiddlewareRegistry.register(createLoggerMiddleware());

// 2. Configuración Síncrona del Motor
elmEngine.configure({
    effectHandlers,
    middlewares: MiddlewareRegistry.getGlobals()
});

console.log('[BOOTSTRAP] 🚀 Infraestructura base configurada (Synchronous)');
