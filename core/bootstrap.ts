import { elmEngine } from '@core/engine/engine_config';
import { effectHandlers } from '@core/tea-utils/effect_handlers';
import { MiddlewareRegistry } from '@core/tea-utils/middleware_registry';
import { createLoggerMiddleware } from '@core/middlewares/logger.middleware';
import { createTimeIntegrityMiddleware } from '@core/middlewares/time-integrity-v2.middleware';
import { TimerRepository } from '@/shared/repositories/system/time/timer.repository';
import { TimeIntegrityPolicy, ValidationResult } from '@/shared/core/policies/time-integrity.policy';
import { globalSignalBus } from '@/shared/core/tea-utils/signal_bus';
import { GLOBAL_LOGOUT } from '@/config/signals';

/**
 * Bootstrapping de infraestructura base del motor TEA.
 * Este archivo se importa como side-effect en el punto de entrada
 * del sistema (CoreModule) para garantizar que el motor esté
 * configurado ANTES de que cualquier store intente usarlo.
 */

// 1. Registro de Middlewares Globales
MiddlewareRegistry.register(createLoggerMiddleware());

// Configuración del middleware de integridad de tiempo
MiddlewareRegistry.register(createTimeIntegrityMiddleware({
    // Definimos qué mensajes requieren validación (ej: acciones críticas)
    isProtected: (msg: any) => {
        const type = msg?.type || '';
        // Extendemos la protección a mensajes de sesión y transacciones
        return type.includes('BET') ||
            type.includes('LOGIN') ||
            type.includes('PAYMENT') ||
            type.includes('SESSION') ||
            type.includes('TRANSACTION');
    },
    // Inyectamos la lógica de validación del repositorio adaptada al tipo ValidationResult
    checkIntegrity: async (): Promise<ValidationResult> => {
        const result = await TimerRepository.validateIntegrity(Date.now());
        if (result.status === 'ok') {
            return { status: 'ok' };
        }
        return {
            status: 'violation',
            reason: result.reason,
            violationType: result.status === 'jump' ? 'forward_jump' : 'backward_jump',
            jumpMs: result.deltaMs
        };
    },
    // Inyectamos la reacción (mensaje global de logout si es grave)
    onViolation: (result) => {
        if (TimeIntegrityPolicy.shouldForceLogout(result)) {
            globalSignalBus.send(GLOBAL_LOGOUT());
        }
    }
}));

// 2. Configuración Síncrona del Motor
elmEngine.configure({
    effectHandlers,
    middlewares: MiddlewareRegistry.getGlobals()
});

console.log('[BOOTSTRAP] 🚀 Infraestructura base configurada (Synchronous)');
