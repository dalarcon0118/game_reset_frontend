/**
 * TEA Engine - New implementation with advanced features
 * 
 * Features:
 * - Dual API (positional + config object)
 * - Global StoreRegistry
 * - Global middleware and effect handlers registration
 */

import { create } from 'zustand';
import { SubDescriptor } from '../tea-utils/sub';
import { logger } from '../../utils/logger';
import { Cmd, CommandDescriptor } from '../tea-utils/cmd';
import { TeaMiddleware } from '../tea-utils/middleware.types';
import { StoreRegistry } from './store_registry';
import { ElmStore, ElmStoreConfig, UpdateResult, StoreState, EffectHandler } from './types';

const log = logger.withTag('TEA_ENGINE');

// Global registries
let globalEffectHandlers: Record<string, EffectHandler> = {};
let globalMiddlewares: TeaMiddleware<any, any>[] = [];

/**
 * Register global effect handlers
 */
export const registerEffectHandlers = (handlers: Record<string, EffectHandler>): void => {
    globalEffectHandlers = { ...globalEffectHandlers, ...handlers };
    log.info('Global effect handlers registered', 'TEA_ENGINE');
};

/**
 * Register global middlewares
 */
export const registerMiddlewares = (...middlewares: TeaMiddleware<any, any>[]): void => {
    globalMiddlewares.push(...middlewares);
    log.info('Global middlewares registered', 'TEA_ENGINE');
};

/**
 * Get global effect handlers
 */
export const getGlobalEffectHandlers = () => globalEffectHandlers;

/**
 * Get global middlewares
 */
export const getGlobalMiddlewares = () => globalMiddlewares;

/**
 * Create ElmStore - supports both positional and config API
 */
export function createElmStore<TModel, TMsg>(
    config: ElmStoreConfig<TModel, TMsg>
): ElmStore<TModel, TMsg>;
export function createElmStore<TModel, TMsg>(
    initial: TModel | ((params?: any) => UpdateResult<TModel, TMsg>),
    update: (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>,
    effectHandlers?: Record<string, EffectHandler>,
    subscriptions?: (model: TModel) => SubDescriptor<TMsg>,
    middlewares?: TeaMiddleware<TModel, TMsg>[]
): ElmStore<TModel, TMsg>;
export function createElmStore<TModel, TMsg>(
    firstArg:
        | TModel
        | ((params?: any) => UpdateResult<TModel, TMsg>)
        | ElmStoreConfig<TModel, TMsg>,
    ...rest: any[]
): ElmStore<TModel, TMsg> {

    // Detect config mode
    const isConfigMode = firstArg &&
        typeof firstArg === 'object' &&
        !Array.isArray(firstArg) &&
        'update' in (firstArg as any) &&
        ('initial' in (firstArg as any));

    let config: ElmStoreConfig<TModel, TMsg>;

    if (isConfigMode) {
        config = firstArg as ElmStoreConfig<TModel, TMsg>;
    } else {
        const [update, effectHandlers, subscriptions, middlewares] = rest;
        config = {
            initial: firstArg as TModel | ((params?: any) => UpdateResult<TModel, TMsg>),
            update: update as (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>,
            effectHandlers,
            subscriptions,
            middlewares
        };
    }

    const {
        id,
        name,
        initial,
        update,
        subscriptions,
        middlewares = globalMiddlewares
    } = config;

    // Merge global and local effect handlers, local overrides global if keys collide
    const effectHandlers = { ...globalEffectHandlers, ...(config.effectHandlers || {}) };

    // Combine middlewares
    const combinedMiddlewares = [...globalMiddlewares, ...(middlewares || [])];
    const allMiddlewares: TeaMiddleware<TModel, TMsg>[] = [];
    const seenIds = new Set<string>();

    for (const mw of combinedMiddlewares) {
        if (mw.id) {
            if (seenIds.has(mw.id)) continue;
            seenIds.add(mw.id);
        }
        allMiddlewares.push(mw);
    }

    const metaRegistry = new WeakMap<any, Record<string, any>>();

    const store = create<StoreState<TModel, TMsg>>((set, get) => {
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
                log.error('Message Storm Detected!', 'TEA_ENGINE_STORM');
                return true;
            }
            return isStorming;
        };

        const executeCmds = (cmd: Cmd, parentMeta?: Record<string, any>) => {
            const dispatchWithMeta = (nextMsg: TMsg) => {
                if (parentMeta) {
                    metaRegistry.set(nextMsg, { ...parentMeta });
                }
                get().dispatch(nextMsg);
            };

            const flattenCmds = (c: Cmd): CommandDescriptor[] => {
                if (!c) return [];
                if (Array.isArray(c)) {
                    return c.reduce((acc, item) => acc.concat(flattenCmds(item)), [] as CommandDescriptor[]);
                }
                return [c];
            };

            const cmdsToExecute = flattenCmds(cmd);
            cmdsToExecute.forEach(async (singleCmd: any) => {
                if (singleCmd && typeof singleCmd === 'object') {
                    if (singleCmd.type && effectHandlers[singleCmd.type]) {
                        try {
                            const currentMeta = parentMeta || {};
                            allMiddlewares.forEach(m => m.beforeCmd?.(singleCmd, currentMeta));
                            const handlerResult = effectHandlers[singleCmd.type](singleCmd.payload, dispatchWithMeta);

                            // Duck typing for Task support
                            const result = (handlerResult && typeof (handlerResult as any).fork === 'function')
                                ? await (handlerResult as any).fork()
                                : await handlerResult;

                            if (singleCmd.payload && singleCmd.payload.msgCreator) {
                                dispatchWithMeta(singleCmd.payload.msgCreator(result));
                            }
                        } catch (error) {
                            if (singleCmd.payload && singleCmd.payload.errorCreator) {
                                dispatchWithMeta(singleCmd.payload.errorCreator(error));
                            }
                        }
                    }
                }
            });
        };

        const initialResult = typeof initial === 'function' ? (initial as any)() : [initial, null];
        const [initialModel, initialCmd] = initialResult;

        return {
            model: initialModel,
            init: (params?: any) => {
                const initMeta = { traceId: 'INIT-' + Math.random().toString(36).substring(2, 6).toUpperCase() };
                if (params !== undefined && typeof initial === 'function') {
                    const [nextModel, cmd] = (initial as Function)(params);
                    set({ model: nextModel });
                    if (cmd) executeCmds(cmd, initMeta);
                } else if (initialCmd) {
                    executeCmds(initialCmd, initMeta);
                }
            },
            cleanup: () => {
                log.debug('Engine cleanup called', 'TEA_ENGINE');
            },
            dispatch: (msg: TMsg) => {
                if (!msg) return;
                const msgType = (msg as any).type || 'UNKNOWN';
                if (checkStorm(msgType)) return;

                let meta = metaRegistry.get(msg);
                if (!meta) {
                    meta = {};
                    metaRegistry.set(msg, meta);
                }

                let cmdToRun: Cmd = null;

                try {
                    const prevModel = get().model;
                    allMiddlewares.forEach(m => m.beforeUpdate?.(prevModel, msg, meta!));

                    let nextModel: TModel;
                    let cmd: Cmd = null;

                    const result = update(prevModel, msg);
                    if (Array.isArray(result)) {
                        [nextModel, cmd] = result;
                    } else {
                        nextModel = result.model;
                        cmd = result.cmd;
                    }

                    cmdToRun = cmd;
                    set({ model: nextModel });

                    allMiddlewares.forEach(m => m.afterUpdate?.(prevModel, msg, nextModel, cmd || null, meta!));
                } catch (error) {
                    const currentModel = get().model;
                    allMiddlewares.forEach(m => m.onUpdateError?.(currentModel, msg, error, meta!));
                    if (__DEV__) throw error;
                }

                if (cmdToRun) executeCmds(cmdToRun, meta);
            },
        };
    });

    // Subscriptions
    if (subscriptions) {
        const activeSubs = new Map<string, any>();

        const processSub = (sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void) => {
            if (sub.type === 'BATCH') {
                sub.payload.forEach((s: SubDescriptor<TMsg>) => processSub(s, dispatch));
                return;
            }

            if (sub.type === 'EVERY') {
                const { id: subId, ms, msg } = sub.payload;
                if (!activeSubs.has(subId)) {
                    const interval = setInterval(() => dispatch(msg), ms);
                    activeSubs.set(subId, { type: 'EVERY', interval });
                }
            }

            if (sub.type === 'WATCH_STORE') {
                const { id: subId, store: externalStore, selector, msgCreator } = sub.payload;
                if (!activeSubs.has(subId)) {
                    const initialValue = selector(externalStore.getState().model || externalStore.getState());
                    let lastValue = initialValue;

                    const unsubscribe = externalStore.subscribe((state: any) => {
                        const selectedValue = selector(state.model || state);
                        if (selectedValue !== lastValue && selectedValue != null) {
                            lastValue = selectedValue;
                            dispatch(msgCreator(selectedValue));
                        }
                    });

                    activeSubs.set(subId, { type: 'WATCH_STORE', unsubscribe, lastValue });

                    setTimeout(() => {
                        if (activeSubs.has(subId)) {
                            const msg = msgCreator(initialValue);
                            if (msg) dispatch(msg);
                        }
                    }, 100);
                }
            }

            if (sub.type === 'CUSTOM') {
                const { id: subId, subscribe } = sub.payload;
                if (!activeSubs.has(subId)) {
                    const unsubscribe = subscribe(dispatch);
                    activeSubs.set(subId, { type: 'CUSTOM', unsubscribe });
                }
            }
        };

        const cleanupSubs = (currentSubs: Set<string>) => {
            activeSubs.forEach((sub, subId) => {
                if (!currentSubs.has(subId)) {
                    if (sub.type === 'EVERY') {
                        clearInterval(sub.interval);
                    } else if (sub.type === 'WATCH_STORE' || sub.type === 'CUSTOM') {
                        sub.unsubscribe();
                    }
                    activeSubs.delete(subId);
                }
            });
        };

        store.setState({
            cleanup: () => cleanupSubs(new Set()),
        });

        const getActiveIds = (sub: SubDescriptor<TMsg>, ids: Set<string> = new Set()): Set<string> => {
            if (sub.type === 'BATCH') {
                sub.payload.forEach((s: SubDescriptor<TMsg>) => getActiveIds(s, ids));
            } else if (sub.payload?.id) {
                ids.add(sub.payload.id);
            }
            return ids;
        };

        let lastIds = new Set<string>();

        const manageSubscriptions = (model: TModel, dispatch: (msg: TMsg) => void) => {
            const currentSub = subscriptions(model);
            if (!currentSub || typeof currentSub !== 'object' || !currentSub.type) return;

            const currentIds = getActiveIds(currentSub);
            const idsChanged = currentIds.size !== lastIds.size ||
                Array.from(currentIds).some(id => !lastIds.has(id));

            if (!idsChanged) return;

            lastIds = currentIds;
            cleanupSubs(currentIds);
            processSub(currentSub, dispatch);
        };

        store.subscribe((state) => {
            manageSubscriptions(state.model, state.dispatch);
        });

        manageSubscriptions(store.getState().model, store.getState().dispatch);
    }

    // Register in StoreRegistry
    if (id) {
        StoreRegistry.register(id, store);
    }

    // Auto-init
    /*if (typeof initial === 'function') {
        store.getState().init();
    }*/

    return store;
}
