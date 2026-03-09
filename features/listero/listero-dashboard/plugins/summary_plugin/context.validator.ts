import { SummaryPluginContext } from './domain/models';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SUMMARY_PLUGIN_VALIDATOR');

export interface ContextValidationError {
    missingProperties: string[];
    invalidTypes: string[];
}

/**
 * Valida que el contexto proporcionado por el Host cumpla con los requisitos mínimos del Plugin.
 */
export const validatePluginContext = (context: any): { isValid: boolean; error?: string } => {
    if (!context) {
        return { isValid: false, error: 'Context is null or undefined' };
    }

    const missingProps: string[] = [];

    // 1. Validar HostStore y Storage
    if (!context.hostStore) {
        missingProps.push('hostStore');
    }

    if (!context.storage || typeof context.storage.getItem !== 'function') {
        missingProps.push('storage');
    }

    // 2. Validar propiedades de negocio dentro de state
    if (!context.state) {
        missingProps.push('state');
    } else {
        if (!context.state.userStructureId) missingProps.push('state.userStructureId');
        if (context.state.commissionRate === undefined) missingProps.push('state.commissionRate');
    }

    if (missingProps.length > 0) {
        const errorMsg = `Invalid Plugin Context. Missing required properties: ${missingProps.join(', ')}`;
        log.error(errorMsg, { contextKeys: Object.keys(context) });
        return { isValid: false, error: errorMsg };
    }

    return { isValid: true };
};
