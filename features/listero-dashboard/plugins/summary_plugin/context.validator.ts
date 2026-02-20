import { SummaryPluginContext } from './domain/services';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SUMMARY_PLUGIN_VALIDATOR');

export interface ContextValidationError {
    missingProperties: string[];
    invalidTypes: string[];
}

/**
 * Valida que el contexto proporcionado por el Host cumpla con los requisitos mínimos del Plugin.
 * Esto actúa como un "Contrato de Runtime" para evitar errores silenciosos o crashes.
 */
export const validatePluginContext = (context: any): { isValid: boolean; error?: string } => {
    if (!context) {
        return { isValid: false, error: 'Context is null or undefined' };
    }

    const missingProps: string[] = [];

    // 1. Validar API básica
    if (!context.api) {
        missingProps.push('api');
    } else {
        if (typeof context.api.get !== 'function') missingProps.push('api.get');
        // Ya no requerimos FinancialSummaryService explícitamente, pero si el contrato lo pidiera, lo validaríamos aquí.
    }

    // 2. Validar Storage
    if (!context.storage) {
        missingProps.push('storage');
    } else {
        if (typeof context.storage.getItem !== 'function') missingProps.push('storage.getItem');
        if (typeof context.storage.setItem !== 'function') missingProps.push('storage.setItem');
    }

    // 3. Validar Estado del Host
    if (!context.state) {
        missingProps.push('state');
    } else {
        // Validamos propiedades críticas del estado que el plugin consume
        // En este caso, structureId parece ser crítico
        if (context.state.userStructureId === undefined) missingProps.push('state.userStructureId');
    }

    if (missingProps.length > 0) {
        const errorMsg = `Invalid Plugin Context. Missing required services/properties: ${missingProps.join(', ')}`;
        log.error(errorMsg, { contextKeys: Object.keys(context) });
        return { isValid: false, error: errorMsg };
    }

    return { isValid: true };
};
