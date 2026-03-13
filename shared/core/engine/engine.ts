import { create, StoreApi } from 'zustand';
import { SubDescriptor } from '../tea-utils/sub';
import { logger } from '../../utils/logger';
import { globalEventRegistry } from '../tea-utils/events';
import { globalSignalBus } from '../tea-utils/signal_bus';
import { Return } from '../tea-utils/return';
import { TeaMiddleware, TeaMiddlewareCodec } from '../tea-utils/middleware.types';
import { MiddlewareRegistry } from '../tea-utils/middleware_registry';
import { isLeft } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { Cmd, CommandDescriptor } from '../tea-utils/cmd';
import { elmEngine } from './engine_config';
import { effectHandlers as fallbackEffectHandlers } from '../tea-utils/effect_handlers';
import { storeRegistry } from './store_registry';

// La estructura que debe devolver cualquier función 'update'
export type UpdateResult<TModel, TMsg> = [TModel, Cmd] | Return<TModel, TMsg>;

export interface ElmStoreConfig<TModel, TMsg> {
    initial: TModel | ((params?: any) => UpdateResult<TModel, TMsg>);
    update: (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>;
    subscriptions?: (model: TModel) => SubDescriptor<TMsg>;
    effectHandlers?: Record<string, (payload: any, dispatch: (msg: TMsg) => void) => Promise<any>>;
    middlewares?: TeaMiddleware<TModel, TMsg>[];
    name?: string;
}

export const createElmStore = <TModel, TMsg>(
    config: ElmStoreConfig<TModel, TMsg>
) => {
    const { initial, update, subscriptions, effectHandlers, middlewares } = config;
    // Obtener effectHandlers globales si no se proporcionan
    const globalEffectHandlers = elmEngine.getEffectHandlers();
    const finalEffectHandlers: any = effectHandlers ?? globalEffectHandlers ?? fallbackEffectHandlers;

    // --- Lazy Validation & Resilience ---
    // If we're using fallback because global hasn't been configured yet, log a warning (only in dev)
    if (__DEV__ && !effectHandlers && !globalEffectHandlers && fallbackEffectHandlers) {
        logger.debug(
            '[TEA_ENGINE] Note: Using fallbackEffectHandlers. ' +
            'Ensure elmEngine.configure() is called during app bootstrap if you want global custom handlers.',
            'ENGINE_INIT'
        );
    }

    const isValidEffectHandlers = !!finalEffectHandlers && (
        typeof finalEffectHandlers === 'object' || typeof finalEffectHandlers === 'function'
    );

    if (!isValidEffectHandlers) {
        // Instead of a fatal throw at creation, we'll log an error and use a dummy object
        // The real error will happen when a Cmd is executed if handlers are still missing.
        logger.error(
            '[TEA_ENGINE] CRITICAL: No effectHandlers available during store creation. ' +
            'This will cause Cmd execution to fail. Check your CoreModule configuration.',
            'ENGINE_INIT'
        );
    }

    // Obtener middlewares globales de elmEngine
    const globalMiddlewares = elmEngine.getMiddlewares();
    // Combinar: global de elmEngine + local (si se pasa)
    const middlewaresToCombine = middlewares ?? [];
    // Combine global and local middlewares, filtering duplicates by ID
    // Priority: MiddlewareRegistry.getGlobals() -> elmEngine.getMiddlewares() -> local middlewares
    const combined = [...MiddlewareRegistry.getGlobals(), ...globalMiddlewares, ...middlewaresToCombine];
    const allMiddlewares: TeaMiddleware<TModel, TMsg>[] = [];
    const seenIds = new Set<string>();

    for (const mw of combined) {
        if (mw.id) {
            if (seenIds.has(mw.id)) continue;
            seenIds.add(mw.id);
        }
        allMiddlewares.push(mw);
    }

    // --- Metadata & Traceability System ---
    // Engine only manages propagation, not business logic of metadata
    const metaRegistry = new WeakMap<any, Record<string, any>>();

    /**
     * Helper to generate a unique traceId for each transaction (Msg processing).
     */
    const generateTraceId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    const getOrCreateMeta = (msg: any): Record<string, any> => {
        if (!msg || typeof msg !== 'object') return {};

        let meta = metaRegistry.get(msg);
        if (!meta) {
            meta = {
                traceId: generateTraceId(),
                timestamp: Date.now()
            };
            metaRegistry.set(msg, meta);
        }
        return meta;
    };

    // --- Middleware Validation ---
    if (allMiddlewares && allMiddlewares.length > 0) {
        allMiddlewares.forEach((m, i) => {
            const result = TeaMiddlewareCodec.decode(m);
            if (isLeft(result)) {
                logger.error(`Middleware at index ${i} is invalid`, 'ENGINE_INIT', { errors: PathReporter.report(result) });
            } else {
                // Check for unknown properties manually since io-ts strips them on decode
                // We want to warn the developer if they passed 'onMsg' instead of 'beforeUpdate'
                const knownKeys = Object.keys(result.right);
                const actualKeys = Object.keys(m);
                const extraKeys = actualKeys.filter(k => !knownKeys.includes(k));

                if (extraKeys.length > 0) {
                    logger.warn(
                        `Middleware at index ${i} has unknown properties: [${extraKeys.join(', ')}]. \n` +
                        `Did you mean 'beforeUpdate' or 'afterUpdate'? \n` +
                        `Allowed keys are: ${knownKeys.join(', ')}`,
                        'ENGINE_INIT'
                    );
                }
            }
        });
    }

    const store = create<{
        model: TModel;
        dispatch: (msg: TMsg) => void;
        init: (params?: any) => void;
        cleanup: () => void;
    }>((set, get) => {
        // --- Storm Protection ---
        let msgCount = 0;
        let lastMsgTime = Date.now();
        const MAX_MSGS_PER_SECOND = 50;
        let isStorming = false;

        const checkStorm = (msgType: string) => {
            const now = Date.now();
            if (now - lastMsgTime < 1000) {
                msgCount++;
            } else {
                msgCount = 1;
                lastMsgTime = now;
                isStorming = false;
            }

            if (msgCount > MAX_MSGS_PER_SECOND && !isStorming) {
                isStorming = true;
                logger.error(
                    `Message Storm Detected! More than ${MAX_MSGS_PER_SECOND} messages in 1s. Possible infinite loop with: ${msgType}. Throttling engine.`,
                    'ENGINE_STORM_PROTECTION'
                );
                return true;
            }
            return isStorming;
        };

        const executeCmds = (cmd: Cmd, parentMeta?: Record<string, any>) => {
            const dispatchWithMeta = (nextMsg: TMsg) => {
                // Validate message before using as WeakMap key
                if (nextMsg && typeof nextMsg === 'object') {
                    metaRegistry.set(nextMsg, { ...parentMeta });
                }
                // Only dispatch valid messages (objects), skip primitives like undefined/null
                // This handles the case where Cmd.task's default onSuccess: (x) => x returns undefined
                if (nextMsg && typeof nextMsg === 'object') {
                    get().dispatch(nextMsg);
                } else if (nextMsg !== undefined) {
                    // Log non-object but valid messages (e.g., strings)
                    logger.warn('Dispatch received non-object message', 'ENGINE', { msg: nextMsg });
                    get().dispatch(nextMsg);
                }
                // Silent skip for undefined - this is expected when tasks return nothing
            };

            const flattenCmds = (c: Cmd): CommandDescriptor[] => {
                if (!c) return [];
                if (Array.isArray(c)) {
                    return c.reduce((acc, item) => acc.concat(flattenCmds(item)), [] as CommandDescriptor[]);
                }

                // --- Safety Check: Detect functions being passed as commands ---
                if (typeof c === 'function') {
                    const error = new Error(
                        `[TEA_ENGINE] ERROR: Received a function instead of a CommandDescriptor. \n` +
                        `Did you forget to call a command creator like fetchXXXXCmd()? \n` +
                        `Source: ${(c as any).toString().substring(0, 100)}...`
                    );
                    logger.error(error.message, 'ENGINE_VALIDATION', error);
                    if (__DEV__) throw error;
                    return [];
                }

                return [c];
            };

            const cmdsToExecute = flattenCmds(cmd);
            cmdsToExecute.forEach(async (singleCmd: any) => {
                // --- Additional Validation ---
                if (singleCmd && typeof singleCmd !== 'object') {
                    logger.error(`Invalid command detected: expected object, got ${typeof singleCmd}`, 'ENGINE_VALIDATION', { singleCmd });
                    return;
                }

                const handlersToUse = finalEffectHandlers || fallbackEffectHandlers;
                const handler = (handlersToUse as any)[singleCmd.type];

                // --- Special Case: Global Signals (TEA-Agnostic) ---
                if (singleCmd.type === 'SEND_MSG') {
                    globalSignalBus.send(singleCmd.payload);
                    return;
                }

                if (singleCmd && handler) {
                    try {
                        // Middleware: Before Command
                        const currentMeta = parentMeta || {};
                        allMiddlewares.forEach(m => m.beforeCmd?.(singleCmd, currentMeta));

                        const result = await handler(singleCmd.payload, dispatchWithMeta);
                        if (singleCmd.payload && singleCmd.payload.msgCreator) {
                            dispatchWithMeta(singleCmd.payload.msgCreator(result));
                        }
                    } catch (error) {
                        if (singleCmd.payload && singleCmd.payload.errorCreator) {
                            dispatchWithMeta(singleCmd.payload.errorCreator(error));
                        } else {
                            logger.error(`Unhandled error in Cmd: ${singleCmd.type}`, 'ENGINE', error, { payload: singleCmd.payload });
                        }
                    }
                } else if (singleCmd) {
                    const errorMsg = `No handler found for Cmd type: ${singleCmd.type}`;
                    logger.error(errorMsg, 'ENGINE_EXECUTION', {
                        availableHandlers: handlersToUse ? Object.keys(handlersToUse) : 'none',
                        cmd: singleCmd
                    });
                }
            });
        };


        // Pre-calculate initial model and commands
        const initialResult = typeof initial === 'function' ? (initial as any)() : [initial, null];
        const [initialModel, initialCmd] = initialResult;

        return {
            model: initialModel,
            init: (params?: any) => {
                const initMeta = { traceId: 'INIT-' + Math.random().toString(36).substring(2, 6).toUpperCase() };
                // If called with params, or if it's the first time and we have initial commands
                if (params !== undefined && typeof initial === 'function') {
                    const [nextModel, cmd] = (initial as Function)(params);
                    set({ model: nextModel });
                    if (cmd) executeCmds(cmd, initMeta);
                } else if (initialCmd) {
                    // Execute initial commands if they exist
                    executeCmds(initialCmd, initMeta);
                }
            },
            cleanup: () => {
                // Default no-op, will be overridden if subscriptions exist
                logger.debug('Engine cleanup: No subscriptions to clean', 'ENGINE_CLEANUP');
                if (config.name) {
                    storeRegistry.unregister(config.name);
                }
            },
            dispatch: (msg: TMsg) => {
                if (!msg) {
                    logger.error('Dispatch called with null or undefined message', 'ENGINE', { msg });
                    return;
                }
                const msgType = (msg as any).type || 'UNKNOWN';
                if (checkStorm(msgType)) return;

                // --- Retrieve/Initialize Metadata ---
                const meta = getOrCreateMeta(msg);

                let cmdToRun: Cmd = null;

                try {
                    // Middlewares: Before Update
                    const prevModel = get().model;
                    allMiddlewares.forEach(m => m.beforeUpdate?.(prevModel, msg, meta));

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
                        // Fallback assuming destructuring works on whatever it is
                        [nextModel, cmd] = result as any;
                    }

                    cmdToRun = cmd;
                    set({ model: nextModel });

                    // Middlewares: After Update
                    allMiddlewares.forEach(m => m.afterUpdate?.(prevModel, msg, nextModel, cmd || null, meta));

                } catch (error) {
                    const currentModel = get().model;
                    logger.error(`Error in update function for Msg: ${msgType}`, 'ENGINE', error, { msg, meta });

                    // Middlewares: On Error
                    allMiddlewares.forEach(m => m.onUpdateError?.(currentModel, msg, error, meta));

                    if (__DEV__) {
                        // Fail Fast in development: This triggers the Red Box in React Native
                        // providing much better visibility of the bug.
                        throw error;
                    }
                }


                if (cmdToRun) executeCmds(cmdToRun, meta);
            },
        };
    });

    // Gestión de Subscripciones
    if (subscriptions) {
        const activeSubs = new Map<string, any>();

        const processSub = (sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void) => {
            if (sub.type === 'BATCH') {
                sub.payload.forEach((s: SubDescriptor<TMsg>) => processSub(s, dispatch));
                return;
            }

            if (sub.type === 'EVERY') {
                const { id, ms, msg } = sub.payload;
                if (!activeSubs.has(id)) {
                    logger.debug(`Starting interval sub: ${id} (${ms}ms)`, 'ENGINE');
                    const interval = setInterval(() => dispatch(msg), ms);
                    activeSubs.set(id, { type: 'EVERY', interval });
                }
            }

            if (sub.type === 'WATCH_STORE') {
                const { id, store: externalStoreRef, selector, msgCreator } = sub.payload;
                if (!activeSubs.has(id)) {
                    // Intenta resolver el store (puede ser una referencia directa o un ID de string)
                    let externalStore: StoreApi<any> | undefined;

                    if (typeof externalStoreRef === 'string') {
                        externalStore = storeRegistry.get(externalStoreRef);
                    } else if (externalStoreRef && typeof (externalStoreRef as any).getState === 'function') {
                        externalStore = externalStoreRef as StoreApi<any>;
                    } else if (typeof externalStoreRef === 'function') {
                        // Es un hook de React o una función factory, no podemos usarlo aquí directamente
                        // Buscamos en el registro por si el store ya fue creado e indexado
                        const possibleId = (externalStoreRef as any).displayName || (externalStoreRef as any).name;
                        if (possibleId) {
                            externalStore = storeRegistry.get(possibleId);
                        }
                    }

                    if (!externalStore) {
                        logger.warn(`WATCH_STORE sub "${id}" delayed: Store not found or not yet registered.`, 'ENGINE', { storeRef: externalStoreRef });
                        // Re-intentar en el próximo tick o cuando el store se registre (implementación simplificada: esperar)
                        return;
                    }

                    logger.debug(`Starting reactive sub: ${id} (WATCH_STORE)`, 'ENGINE');
                    // Pre-calculamos el valor inicial
                    const initialState = externalStore.getState();
                    const initialValue = selector(initialState.model || initialState);
                    let lastValue = initialValue;

                    // Nos suscribimos a cambios futuros
                    const unsubscribe = externalStore.subscribe((state: any) => {
                        const selectedValue = selector(state.model || state);
                        if (selectedValue !== lastValue && selectedValue != null) {
                            lastValue = selectedValue;
                            dispatch(msgCreator(selectedValue));
                        }
                    });

                    activeSubs.set(id, { type: 'WATCH_STORE', unsubscribe, lastValue });

                    setTimeout(() => {
                        if (activeSubs.has(id)) {
                            const msg = msgCreator(initialValue);
                            if (msg) dispatch(msg);
                        }
                    }, 100);
                }
            }

            if (sub.type === 'EVENT') {
                const { id, event, target, msgCreator } = sub.payload;
                if (!activeSubs.has(id)) {
                    logger.debug(`Starting reactive sub: ${id} (EVENT)`, 'ENGINE');
                    const handler = globalEventRegistry.getHandler(event);
                    if (handler) {
                        const resolvedTarget = typeof target === 'function' ? target() : target;
                        const unsubscribe = handler.subscribe(resolvedTarget, (eventData: any) => {
                            dispatch(msgCreator(eventData));
                        });
                        activeSubs.set(id, { type: 'EVENT', unsubscribe });
                    } else {
                        logger.warn(`No handler registered for event type: ${event.type}`, 'ENGINE');
                    }
                }
            }

            if (sub.type === 'SSE') {
                const { id, url, msgCreator, headers } = sub.payload;
                if (!activeSubs.has(id)) {
                    logger.info(`Connecting to SSE stream: ${url}`, 'ENGINE');

                    // 1. Set placeholder to prevent re-entry and handle early cleanup
                    let isCancelled = false;
                    const placeholder = {
                        close: () => { isCancelled = true; }
                    };
                    activeSubs.set(id, { type: 'SSE', eventSource: placeholder });

                    // 2. Defer creation to next tick to avoid "already sending" race condition
                    // Increased timeout to 500ms to allow proper XHR cleanup in React Native
                    setTimeout(() => {
                        if (isCancelled || !activeSubs.has(id)) {
                            logger.debug(`SSE connection cancelled before start: ${id}`, 'ENGINE');
                            return;
                        }

                        try {
                            const GlobalEventSource = (global as any).EventSource || (window as any).EventSource || (typeof EventSource !== 'undefined' ? EventSource : null);

                            if (!GlobalEventSource) {
                                throw new Error("EventSource is not defined in this environment");
                            }

                            // Pass headers to EventSource (supported by event-source-polyfill)
                            // Use heartbeatTimeout to detect stale connections
                            const eventSource = new GlobalEventSource(url, {
                                headers,
                                heartbeatTimeout: 45000 // 45s heartbeat timeout
                            });

                            eventSource.onmessage = (event: any) => {
                                try {
                                    const data = JSON.parse(event.data);
                                    logger.debug('SSE Message received', 'ENGINE', data);
                                    dispatch(msgCreator(data));
                                } catch (e) {
                                    logger.error('Error parsing SSE data', 'ENGINE', e);
                                }
                            };

                            eventSource.onerror = (error: any) => {
                                // Enhanced error logging
                                logger.error(`SSE Stream Error for ${id}`, 'ENGINE', error);

                                // Always close on error to prevent polyfill's internal retry loop 
                                // which can cause "Cannot open, already sending" errors in RN
                                try {
                                    eventSource.close();
                                } catch (e) {
                                    logger.warn('Error closing EventSource', 'ENGINE', e);
                                }

                                // Remove from active subs and lastIds so it can be recreated on next cycle
                                activeSubs.delete(id);
                                lastIds.delete(id);
                            };

                            // Double check cancellation before finalizing
                            if (isCancelled || !activeSubs.has(id)) {
                                eventSource.close();
                                return;
                            }

                            activeSubs.set(id, { type: 'SSE', eventSource });
                        } catch (e) {
                            logger.error(`Failed to create EventSource for ${id}`, 'ENGINE', e);
                            activeSubs.delete(id); // Remove placeholder if creation failed
                        }
                    }, 500);
                }
            }



            if (sub.type === 'RECEIVE_MSG') {
                const { id, signal, handler } = sub.payload;
                const signalType = signal.toString();
                if (!activeSubs.has(id)) {
                    logger.debug(`Starting global signal sub: ${id} (${signalType})`, 'ENGINE');
                    const unsubscribe = globalSignalBus.subscribe(signalType, (payload) => {
                        handler(payload, dispatch);
                    });
                    activeSubs.set(id, { type: 'RECEIVE_MSG', unsubscribe });
                }
            }

            if (sub.type === 'CUSTOM') {
                const { id, subscribe } = sub.payload;
                if (!activeSubs.has(id)) {
                    logger.debug(`Starting custom sub: ${id}`, 'ENGINE');
                    const unsubscribe = subscribe(dispatch);
                    activeSubs.set(id, { type: 'CUSTOM', unsubscribe });
                }
            }
        };

        const cleanupSubs = (currentSubs: Set<string>) => {
            activeSubs.forEach((sub, id) => {
                if (!currentSubs.has(id)) {
                    if (sub.type === 'EVERY') {
                        clearInterval(sub.interval);
                    } else if (sub.type === 'WATCH_STORE' || sub.type === 'EVENT' || sub.type === 'CUSTOM' || sub.type === 'RECEIVE_MSG') {
                        sub.unsubscribe();
                    } else if (sub.type === 'SSE') {
                        logger.info(`Disconnecting SSE stream: ${id}`, 'ENGINE');
                        sub.eventSource.close();
                    }
                    activeSubs.delete(id);
                }
            });
        };

        // Override cleanup function to allow full disposal
        store.setState({
            cleanup: () => {
                logger.debug('Engine cleanup: Stopping all subscriptions', 'ENGINE_CLEANUP');
                cleanupSubs(new Set()); // Pass empty set to remove everything
            }
        });

        const getActiveIds = (sub: SubDescriptor<TMsg>, ids: Set<string> = new Set()): Set<string> => {
            if (sub.type === 'BATCH') {
                sub.payload.forEach((s: SubDescriptor<TMsg>) => getActiveIds(s, ids));
            } else if ((sub.type === 'EVERY' || sub.type === 'WATCH_STORE' || sub.type === 'SSE' || sub.type === 'EVENT' || sub.type === 'CUSTOM') && sub.payload.id) {
                ids.add(sub.payload.id);
            }
            return ids;
        };

        let lastIds = new Set<string>();

        const manageSubscriptions = (model: TModel, dispatch: (msg: TMsg) => void) => {
            const currentSub = subscriptions(model);

            // 🔍 Validación de tipos: asegurar que recibimos un SubDescriptor válido
            if (!currentSub || typeof currentSub !== 'object' || !currentSub.type) {
                logger.error(
                    `Invalid subscription returned from subscriptions(). Expected SubDescriptor, got: ${typeof currentSub}`,
                    'ENGINE',
                    { currentSub, modelType: typeof model }
                );
                return;
            }

            const currentIds = getActiveIds(currentSub);

            // Evitar re-procesamiento si los IDs de las subscripciones no han cambiado
            // Y si todas las subscripciones actuales están realmente activas
            const idsChanged = currentIds.size !== lastIds.size ||
                Array.from(currentIds).some(id => !lastIds.has(id)) ||
                Array.from(currentIds).some(id => !activeSubs.has(id));

            if (!idsChanged) {
                return;
            }

            lastIds = currentIds;
            cleanupSubs(currentIds);
            processSub(currentSub, dispatch);
        };

        // Suscribirse a los cambios del modelo para actualizar subscripciones
        store.subscribe((state) => {
            manageSubscriptions(state.model, state.dispatch);
        });

        // Ejecutar inmediatamente el primer ciclo de subscripciones
        manageSubscriptions(store.getState().model, store.getState().dispatch);
    }

    // Auto-inicialización si es necesario
    if (typeof initial === 'function') {
        store.getState().init();
    }

    return store;
};
