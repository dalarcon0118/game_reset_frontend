import { TeaMiddleware } from '../tea-utils/middleware.types';
import { createLazyRef, LazyRef } from '../utils/lazy';

/**
 * Configuración global para el motor TEA.
 * Permite establecer effectHandlers y middlewares una sola vez
 * y reutilizarlos en todos los stores creados con createElmStore.
 */
export interface EngineGlobalConfig {
    effectHandlers: Record<string, (payload: any, dispatch: (msg: any) => void) => Promise<any>>;
    middlewares: TeaMiddleware<any, any>[];
}

/**
 * Singleton para gestionar la configuración global del Engine.
 * Usa LazyRef para evitar race conditions en la inicialización.
 * 
 * @example
 * // En el root de la aplicación (_layout.tsx o App.tsx):
 * import { elmEngine } from '@/shared/core/engine/engine_config';
 * import { effectHandlers } from '@/shared/core/effect_handlers';
 * import { MiddlewareRegistry } from '@/shared/core/middleware_registry';
 * 
 * elmEngine.configure({
 *     effectHandlers,
 *     middlewares: MiddlewareRegistry.getGlobals()
 * });
 * 
 * @example
 * // En cada store, ahora puedes usar:
 * const store = createElmStore(initialModel, update, subscriptions);
 * // Sin necesidad de pasar effectHandlers ni middlewares
 */
class ElmEngineConfig {
    private configRef: LazyRef<EngineGlobalConfig>;

    constructor() {
        this.configRef = createLazyRef<EngineGlobalConfig>();
    }

    /**
     * Configura el Engine con effectHandlers y middlewares globales.
     * Debe llamarse una sola vez en el bootstrap de la aplicación.
     */
    configure(cfg: EngineGlobalConfig): void {
        this.configRef.set(cfg);
    }

    /**
     * Obtiene los effectHandlers globales.
     * @returns Los effectHandlers configurados o undefined si no se han configurado
     */
    getEffectHandlers(): Record<string, (payload: any, dispatch: (msg: any) => void) => Promise<any>> | undefined {
        return this.configRef.getOrElse({} as any).effectHandlers;
    }

    /**
     * Obtiene los middlewares globales.
     * @returns Array de middlewares configurados, o array vacío si no se han configurado
     */
    getMiddlewares(): TeaMiddleware<any, any>[] {
        return this.configRef.getOrElse({ effectHandlers: {}, middlewares: [] } as any).middlewares ?? [];
    }

    /**
     * Verifica si el Engine ha sido configurado.
     */
    isConfigured(): boolean {
        return this.configRef.isSet();
    }

    /**
     * Limpia la configuración (útil para testing).
     */
    reset(): void {
        this.configRef.reset();
    }
}

/**
 * Instancia singleton del configurador del Engine.
 * Importar este módulo y usar elmEngine.configure() en el root de la app.
 */
export const elmEngine = new ElmEngineConfig();
