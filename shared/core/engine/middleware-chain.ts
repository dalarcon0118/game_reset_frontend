/**
 * Chain de Middlewares para el Motor TEA.
 * Maneja combinación, validación y ejecución de middlewares.
 */

import { isLeft } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { TeaMiddleware, TeaMiddlewareCodec } from '../tea-utils/middleware.types';
import { MiddlewareRegistry } from '../tea-utils/middleware_registry';
import { Cmd } from '../tea-utils/cmd';
import { logger } from '../../utils/logger';
import { MessageMeta } from './types';

const log = logger.withTag('MIDDLEWARE_CHAIN');

/**
 * Cadena de middlewares para ejecutar en cada ciclo del motor
 */
export class MiddlewareChain<TModel, TMsg> {
    private middlewares: TeaMiddleware<TModel, TMsg>[] = [];

    constructor(
        private getGlobalMiddlewares: () => TeaMiddleware<TModel, TMsg>[],
        localMiddlewares: TeaMiddleware<TModel, TMsg>[] = []
    ) {
        const globalMiddlewares = this.getGlobalMiddlewares() || [];

        // Combinar con prioridad: globals registry > globals engine > locales
        this.middlewares = this.combineAndDeduplicate([
            ...MiddlewareRegistry.getGlobals(),
            ...globalMiddlewares,
            ...localMiddlewares
        ]);

        this.validate();
    }

    /**
     * Combina middlewares evitando duplicados por ID
     */
    private combineAndDeduplicate(
        middlewares: TeaMiddleware<TModel, TMsg>[]
    ): TeaMiddleware<TModel, TMsg>[] {
        const result: TeaMiddleware<TModel, TMsg>[] = [];
        const seenIds = new Set<string>();

        for (const mw of middlewares) {
            if (mw.id) {
                if (seenIds.has(mw.id)) continue;
                seenIds.add(mw.id);
            }
            result.push(mw);
        }

        return result;
    }

    /**
     * Valida todos los middlewares con io-ts
     */
    private validate(): void {
        if (!this.middlewares || this.middlewares.length === 0) return;

        this.middlewares.forEach((m, i) => {
            const result = TeaMiddlewareCodec.decode(m);

            if (isLeft(result)) {
                log.error(`Middleware at index ${i} is invalid`, 'ENGINE_INIT', {
                    errors: PathReporter.report(result)
                });
                return;
            }

            // Verificar propiedades desconocidas
            const knownKeys = Object.keys(result.right);
            const actualKeys = Object.keys(m);
            const extraKeys = actualKeys.filter(k => !knownKeys.includes(k));

            if (extraKeys.length > 0) {
                log.warn(
                    `Middleware at index ${i} has unknown properties: [${extraKeys.join(', ')}]. ` +
                    `Did you mean 'beforeUpdate' or 'afterUpdate'? ` +
                    `Allowed keys are: ${knownKeys.join(', ')}`,
                    'ENGINE_INIT'
                );
            }
        });
    }

    /**
     * Ejecuta beforeUpdate en todos los middlewares
     */
    beforeUpdate(model: TModel, msg: TMsg, meta: MessageMeta): void {
        this.middlewares.forEach(m => m.beforeUpdate?.(model, msg, meta));
    }

    /**
     * Ejecuta afterUpdate en todos los middlewares
     */
    afterUpdate(
        prevModel: TModel,
        msg: TMsg,
        nextModel: TModel,
        cmd: Cmd,
        meta: MessageMeta
    ): void {
        this.middlewares.forEach(m => m.afterUpdate?.(prevModel, msg, nextModel, cmd, meta));
    }

    /**
     * Ejecuta onUpdateError en todos los middlewares
     */
    onUpdateError(model: TModel, msg: TMsg, error: any, meta: MessageMeta): void {
        this.middlewares.forEach(m => m.onUpdateError?.(model, msg, error, meta));
    }

    /**
     * Ejecuta beforeCmd en todos los middlewares
     */
    beforeCmd(cmd: any, meta: MessageMeta): void {
        this.middlewares.forEach(m => m.beforeCmd?.(cmd, meta));
    }

    /**
     * Obtiene todos los middlewares registrados
     */
    getMiddlewares(): TeaMiddleware<TModel, TMsg>[] {
        return [...this.middlewares];
    }

    /**
     * Verifica si hay middlewares registrados
     */
    hasMiddlewares(): boolean {
        return this.middlewares.length > 0;
    }
}

/**
 * Factory para crear MiddlewareChain desde el engine
 */
export function createMiddlewareChain<TModel, TMsg>(
    getGlobalMiddlewares: () => TeaMiddleware<TModel, TMsg>[],
    localMiddlewares: TeaMiddleware<TModel, TMsg>[] = []
): MiddlewareChain<TModel, TMsg> {
    return new MiddlewareChain<TModel, TMsg>(getGlobalMiddlewares, localMiddlewares);
}
