/**
 * Motor TEA (The Elm Architecture) para Zustand
 * 
 * Este archivo ahora actúa como orquestador, delegando a módulos especializados:
 * - handler-resolver.ts: Resolución de effect handlers
 * - middleware-chain.ts: Gestión de middlewares
 * - metadata.ts: Trazabilidad de mensajes
 * - storm-protection.ts: Protección contra bucles infinitos
 * - command-executor.ts: Ejecución de comandos
 * - subscription-manager.ts: Gestión de suscripciones
 */

import { create } from 'zustand';
import { SubDescriptor } from '../tea-utils/sub';
import { logger } from '../../utils/logger';
import { Return } from '../tea-utils/return';
import { Cmd } from '../tea-utils/cmd';
import { effectHandlers as fallbackEffectHandlers } from '../tea-utils/effect_handlers';
import { storeRegistry } from './store_registry';
import { elmEngine } from './engine_config';

// Nuevas capas
import { createHandlerResolver, HandlerResolver } from './handler-resolver';
import { createMiddlewareChain, MiddlewareChain } from './middleware-chain';
import { createMessageMetadata, MessageMetadata } from './metadata';
import { createStormProtection, StormProtection } from './storm-protection';
import { createCommandExecutor, CommandExecutor } from './command-executor';
import { createSubscriptionManager, SubscriptionManager } from './subscription-manager';

// Tipos (solo exportamos tipos, la interfaz se redefine localmente para compatibilidad)

// La estructura que debe devolver cualquier función 'update'
export type UpdateResult<TModel, TMsg> = [TModel, Cmd] | Return<TModel, TMsg>;

export interface ElmStoreConfig<TModel, TMsg> {
    initial: TModel | ((params?: any) => UpdateResult<TModel, TMsg>);
    update: (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>;
    subscriptions?: (model: TModel) => SubDescriptor<TMsg>;
    effectHandlers?: Record<string, (payload: any, dispatch: (msg: TMsg) => void) => Promise<any>>;
    middlewares?: import('../tea-utils/middleware.types').TeaMiddleware<TModel, TMsg>[];
    name?: string;
}

const log = logger.withTag('ENGINE');

// Flags de desarrollo
const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * Crea un store Elm (The Elm Architecture) usando Zustand
 * 
 * @param config - Configuración del store: initial, update, subscriptions, effectHandlers, middlewares, name
 * @returns Store de Zustand con modelo, dispatch, init y cleanup
 */
export const createElmStore = <TModel, TMsg>(
    config: ElmStoreConfig<TModel, TMsg>
) => {
    const { initial, update, subscriptions, effectHandlers, middlewares } = config;

    // ========================================
    // INICIALIZACIÓN DE CAPAS (fuera del store)
    // ========================================

    // 1. Handler Resolver (prioridad: local > global > fallback)
    const handlerResolver = createHandlerResolver<TMsg>(
        effectHandlers || {},
        () => elmEngine.getEffectHandlers() || {},
        fallbackEffectHandlers
    );

    // 2. Middleware Chain (combinación y validación de middlewares)
    const middlewareChain = createMiddlewareChain<TModel, TMsg>(
        () => elmEngine.getMiddlewares() || [],
        middlewares || []
    );

    // 3. Message Metadata (trazabilidad de mensajes)
    const metadata = createMessageMetadata();

    // 4. Storm Protection (protección contra bucles infinitos)
    const stormProtection = createStormProtection();

    // ========================================
    // CREACIÓN DEL STORE
    // ========================================

    const store = create<{
        model: TModel;
        dispatch: (msg: TMsg) => void;
        init: (params?: any) => void;
        cleanup: () => void;
    }>((set, get) => {

        // Pre-calcular initial model y commands
        const initialResult = typeof initial === 'function' ? (initial as any)() : [initial, null];
        const [initialModel, initialCmd] = initialResult;

        // CommandExecutor REUTILIZABLE - se crea una sola vez
        let commandExecutor: CommandExecutor<TMsg> | null = null;

        const getCommandExecutor = (): CommandExecutor<TMsg> => {
            if (!commandExecutor) {
                // Usamos getter para obtener dispatch dinámico
                commandExecutor = createCommandExecutor(
                    handlerResolver,
                    middlewareChain,
                    () => get().dispatch, // Getter dinámico
                    metadata.getOrCreate({} as any)
                );
            }
            return commandExecutor;
        };

        return {
            model: initialModel,

            // Inicialización del store
            init: (params?: any) => {
                if (params !== undefined && typeof initial === 'function') {
                    const [nextModel, cmd] = (initial as Function)(params);
                    set({ model: nextModel });
                    if (cmd) {
                        getCommandExecutor().execute(cmd);
                    }
                } else if (initialCmd) {
                    getCommandExecutor().execute(initialCmd);
                }
            },

            // Limpieza por defecto
            cleanup: () => {
                log.debug('Engine cleanup: No subscriptions to clean', 'ENGINE_CLEANUP');
                if (config.name) {
                    storeRegistry.unregister(config.name);
                }
            },

            // Dispatch de mensajes
            dispatch: (msg: TMsg) => {
                if (!msg) {
                    log.error('Dispatch called with null or undefined message', 'ENGINE', { msg });
                    return;
                }

                const msgType = (msg as any).type || 'UNKNOWN';

                // Storm Protection
                const stormCheck = stormProtection.check(msgType);
                if (stormCheck.shouldThrottle) return;

                // Obtener/crear metadatos del mensaje
                const meta = metadata.getOrCreate(msg);

                let cmdToRun: Cmd = null;

                try {
                    // Middlewares: Before Update
                    const prevModel = get().model;
                    middlewareChain.beforeUpdate(prevModel, msg, meta);

                    let nextModel: TModel;
                    let cmd: Cmd = null;

                    const result = update(prevModel, msg);
                    if (Array.isArray(result)) {
                        [nextModel, cmd] = result;
                    } else if (result && typeof (result as any)[Symbol.iterator] === 'function') {
                        const iterator = (result as any)[Symbol.iterator]();
                        nextModel = iterator.next().value;
                        cmd = iterator.next().value;
                    } else {
                        [nextModel, cmd] = result as any;
                    }

                    cmdToRun = cmd;
                    set({ model: nextModel });

                    // Middlewares: After Update
                    middlewareChain.afterUpdate(prevModel, msg, nextModel, cmd || null, meta);

                } catch (error) {
                    const currentModel = get().model;
                    log.error(`Error in update function for Msg: ${msgType}`, 'ENGINE', error, { msg, meta });

                    // Middlewares: On Error
                    middlewareChain.onUpdateError(currentModel, msg, error, meta);

                    if (__DEV__) {
                        throw error;
                    }
                }

                // Ejecutar comandos resultantes (reutilizando executor)
                if (cmdToRun) {
                    getCommandExecutor().execute(cmdToRun);
                }
            },
        };
    });

    // ========================================
    // GESTIÓN DE SUSCRIPCIONES
    // ========================================

    if (subscriptions) {
        // Usamos getter para dispatch dinámico
        const subscriptionManager = createSubscriptionManager<TMsg>({
            subscriptionFn: subscriptions,
            getDispatch: () => store.getState().dispatch // Getter dinámico
        });

        // Suscribirse a cambios del modelo
        store.subscribe((state) => {
            subscriptionManager.manageSubscriptions(state.model);
        });

        // Inicializar suscripciones
        subscriptionManager.initialize(store.getState().model);

        // Override cleanup para manejar todas las suscripciones
        store.setState({
            cleanup: () => {
                log.debug('Engine cleanup: Stopping all subscriptions', 'ENGINE_CLEANUP');
                subscriptionManager.cleanupAll();
            }
        });
    }

    // Auto-inicialización si es necesario
    if (typeof initial === 'function') {
        store.getState().init();
    }

    return store;
};
