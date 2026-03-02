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
 * 
 * NOTA: Somos más lenient con la validación ya que el contexto se construye gradualmente.
 * El estado inicial puede no tener todos los datos (se cargan después).
 */
export const validatePluginContext = (context: any): { isValid: boolean; error?: string } => {
    if (!context) {
        return { isValid: false, error: 'Context is null or undefined' };
    }

    const missingProps: string[] = [];

    // 1. Validar API básica - hacer más lenient
    if (!context.api) {
        missingProps.push('api');
    } else {
        if (typeof context.api.get !== 'function') missingProps.push('api.get');
    }

    // 2. Validar Storage - hacer más lenient
    if (!context.storage) {
        missingProps.push('storage');
    } else {
        if (typeof context.storage.getItem !== 'function') missingProps.push('storage.getItem');
        if (typeof context.storage.setItem !== 'function') missingProps.push('storage.setItem');
    }

    // 3. Validar Estado del Host - somos más lenient con valores nulos
    // El estado puede no estar completamente cargado al inicio
    if (!context.state) {
        missingProps.push('state');
    }
    // Nota: No validamos userStructureId aquí ya que puede ser null inicialmente
    // y se cargará después cuando el usuario esté autenticado

    if (missingProps.length > 0) {
        const errorMsg = `Invalid Plugin Context. Missing required services/properties: ${missingProps.join(', ')}`;
        log.error(errorMsg, { contextKeys: Object.keys(context) });
        return { isValid: false, error: errorMsg };
    }

    return { isValid: true };
};
