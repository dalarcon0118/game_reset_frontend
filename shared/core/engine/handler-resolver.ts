/**
 * Resolutor de effect handlers para el Motor TEA.
 * Maneja la prioridad: local > global > fallback
 */

import { EffectHandler, ResolvedHandlers } from './types';
import { logger } from '../../utils/logger';

const log = logger.withTag('HANDLER_RESOLVER');

/**
 * Resuelve los effect handlers con prioridad:
 * 1. Local (pasados en config)
 * 2. Global (del elmEngine)
 * 3. Fallback (effectHandlers por defecto)
 */
export class HandlerResolver<TMsg> {
    private localHandlers: Record<string, EffectHandler<TMsg>>;
    private globalHandlers: Record<string, EffectHandler<TMsg>>;
    private fallbackHandlers: Record<string, EffectHandler<TMsg>>;

    constructor(
        localHandlers: Record<string, any> = {},
        globalHandlers: Record<string, any> = {},
        fallbackHandlers: Record<string, any> = {}
    ) {
        this.localHandlers = localHandlers;
        this.globalHandlers = globalHandlers;
        this.fallbackHandlers = fallbackHandlers;
    }

    /**
     * Resuelve todos los handlers combinados
     */
    resolve(): ResolvedHandlers<TMsg> {
        return {
            ...this.fallbackHandlers,
            ...this.globalHandlers,
            ...this.localHandlers
        };
    }

    /**
     * Obtiene un handler específico por tipo
     */
    getHandler(type: string): EffectHandler<TMsg> | undefined {
        const handlers = this.resolve();

        // Prioridad: local > global > fallback
        const handler = handlers[type];
        if (handler) return handler;

        return this.fallbackHandlers[type];
    }

    /**
     * Obtiene los nombres de todos los handlers disponibles
     */
    getAvailableHandlerNames(): string[] {
        return Object.keys(this.resolve());
    }

    /**
     * Verifica si existe un handler para el tipo dado
     */
    hasHandler(type: string): boolean {
        return this.getHandler(type) !== undefined;
    }

    /**
     * Crea un nuevo resolutor con handlers adicionales
     */
    withLocalHandlers(additional: Record<string, any>): HandlerResolver<TMsg> {
        return new HandlerResolver<TMsg>(
            { ...this.localHandlers, ...additional },
            this.globalHandlers,
            this.fallbackHandlers
        );
    }
}

/**
 * Factory para crear HandlerResolver desde el engine
 */
export function createHandlerResolver<TMsg>(
    localHandlers: Record<string, any> = {},
    getGlobalHandlers: () => Record<string, any> = () => ({}),
    fallbackHandlers: Record<string, any> = {}
): HandlerResolver<TMsg> {
    const globalHandlers = getGlobalHandlers() || {};

    return new HandlerResolver<TMsg>(
        localHandlers,
        globalHandlers,
        fallbackHandlers
    );
}

/**
 * Valida que los handlers sean funciones válidas
 */
export function validateHandlers(
    handlers: Record<string, any>,
    context: string = 'unknown'
): void {
    Object.entries(handlers).forEach(([type, handler]) => {
        if (typeof handler !== 'function') {
            log.warn(`Handler "${type}" in ${context} is not a function`, {
                type: typeof handler
            });
        }
    });
}
