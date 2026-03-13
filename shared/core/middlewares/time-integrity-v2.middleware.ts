import { TeaMiddleware } from '@core/tea-utils/middleware.types';
import { logger } from '@/shared/utils/logger';
import { ValidationResult } from '@core/policies/time-integrity.policy';

const log = logger.withTag('TIME_INTEGRITY_MW_V2');

/**
 * TimeIntegrityConfig
 * Configuración inyectada para el middleware de integridad de tiempo.
 * Proporciona total inversión de control al orquestador.
 */
export interface TimeIntegrityConfig {
    /** Determina si un mensaje requiere validación de integridad de tiempo */
    isProtected: (msg: any) => boolean;
    /** Ejecuta la lógica de validación de integridad de tiempo */
    checkIntegrity: () => Promise<ValidationResult>;
    /** Callback ejecutado cuando se detecta una violación */
    onViolation: (result: ValidationResult) => void;
}

/**
 * TimeIntegrityMeta
 * Interfaz para el objeto meta utilizado por el middleware para persistir
 * el estado de la validación entre beforeUpdate y afterUpdate.
 */
export interface TimeIntegrityMeta {
    timeIntegrityViolation?: ValidationResult;
    timeIntegrityChecked?: boolean;
    traceId?: string;
}

/**
 * Middleware de Integridad de Tiempo (V2 - Arquitectura Desacoplada)
 * 
 * PRINCIPIOS ARQUITECTÓNICOS:
 * 1. SRP (Single Responsibility Principle): Solo valida la integridad del tiempo.
 * 2. Inversión de Control: El middleware no sabe qué mensajes proteger ni cómo reaccionar.
 * 3. Desacoplamiento: No depende de features de negocio ni de servicios imperativos.
 * 
 * @param config Configuración inyectada para definir protección y reacción.
 */
export const createTimeIntegrityMiddleware = (config: TimeIntegrityConfig): TeaMiddleware<any, any> => {
    // Cache local para el último traceId procesado y evitar validaciones redundantes
    let lastProcessedTraceId: string | null = null;

    return {
        id: 'time-integrity-v2',

        beforeUpdate: async (model, msg, meta) => {
            const timeMeta = meta as TimeIntegrityMeta;

            // 1. Deduplicación por TraceID
            if (timeMeta.traceId && timeMeta.traceId === lastProcessedTraceId) {
                timeMeta.timeIntegrityChecked = true;
                return;
            }
            lastProcessedTraceId = timeMeta.traceId || null;

            // 2. Verificación de Protección (Inversión de Control)
            // Delegamos la decisión de si el mensaje debe ser validado a la configuración.
            const isProtected = config.isProtected(msg);

            if (!isProtected) {
                timeMeta.timeIntegrityChecked = true;
                return;
            }

            // 3. Ejecución de la Validación (Inversión de Control)
            // Delegamos la validación a la función inyectada.
            try {
                const result = await config.checkIntegrity();

                if (result.status !== 'ok') {
                    // Guardamos la violación en meta para referencia interna
                    timeMeta.timeIntegrityViolation = result;

                    log.warn('Time integrity violation detected (pure validation)', {
                        violationType: result.violationType,
                        reason: result.reason,
                        jumpMs: result.jumpMs,
                        msgType: (msg as any).type
                    });

                    // 4. Reacción (Inversión de Control)
                    // Delegamos la reacción a la configuración inyectada.
                    config.onViolation(result);
                }

                timeMeta.timeIntegrityChecked = true;

            } catch (error) {
                log.error('Error during time integrity validation', error);
                timeMeta.timeIntegrityChecked = true;
            }
        }
    };
};
