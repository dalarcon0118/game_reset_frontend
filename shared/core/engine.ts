import { create } from 'zustand';
import { SubDescriptor } from './sub';
import { logger } from '../utils/logger';

// Un comando es un descriptor que el Engine puede ejecutar usando effectHandlers
export interface CommandDescriptor {
    type: string;
    payload?: any;
}

export type Cmd = CommandDescriptor | CommandDescriptor[] | null | undefined;

// La estructura que debe devolver cualquier función 'update'
export type UpdateResult<TModel, TMsg> = [TModel, Cmd?];

export const createElmStore = <TModel, TMsg>(
    initial: TModel | ((params?: any) => UpdateResult<TModel, TMsg>),
    update: (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>,
    effectHandlers: Record<string, (payload: any, dispatch: (msg: TMsg) => void) => Promise<any>>,
    subscriptions?: (model: TModel) => SubDescriptor<TMsg>
) => {
    const store = create<{
        model: TModel;
        dispatch: (msg: TMsg) => void;
        init: (params?: any) => void;
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
                    `Message Storm Detected! More than ${MAX_MSGS_PER_SECOND} messages in 1s. Possible infinite loop with: ${msgType}`,
                    'ENGINE_STORM_PROTECTION'
                );
                return true;
            }
            return isStorming;
        };

        const executeCmds = (cmd: Cmd) => {
            const flattenCmds = (c: Cmd): CommandDescriptor[] => {
                if (!c) return [];
                if (Array.isArray(c)) {
                    return c.flatMap(flattenCmds);
                }
                return [c];
            };

            const cmdsToExecute = flattenCmds(cmd);
            cmdsToExecute.forEach(async (singleCmd: any) => {
                if (singleCmd && effectHandlers[singleCmd.type]) {
                    try {
                        logger.debug(`Executing Cmd: ${singleCmd.type}`, 'ENGINE', singleCmd.payload);
                        const result = await effectHandlers[singleCmd.type](singleCmd.payload, get().dispatch);
                        if (singleCmd.payload && singleCmd.payload.msgCreator) {
                            get().dispatch(singleCmd.payload.msgCreator(result));
                        }
                    } catch (error) {
                        if (singleCmd.payload && singleCmd.payload.errorCreator) {
                            get().dispatch(singleCmd.payload.errorCreator(error));
                        } else {
                            logger.error(`Unhandled error in Cmd: ${singleCmd.type}`, 'ENGINE', error, { payload: singleCmd.payload });
                        }
                    }
                } else if (singleCmd) {
                    logger.warn(`Unknown Cmd type: ${singleCmd.type}`, 'ENGINE');
                }
            });
        };

        // Pre-calculate initial model and commands
        const initialResult = typeof initial === 'function' ? (initial as any)() : [initial, null];

        return {
            model: initialResult[0],
            init: (params?: any) => {
                // If called with params, or if it's the first time and we have initial commands
                if (params !== undefined && typeof initial === 'function') {
                    const [nextModel, cmd] = (initial as Function)(params);
                    set({ model: nextModel });
                    if (cmd) executeCmds(cmd);
                } else if (initialResult[1]) {
                    // Execute initial commands if they exist
                    executeCmds(initialResult[1]);
                }
            },
            dispatch: (msg: TMsg) => {
                const msgType = (msg as any).type || 'UNKNOWN';
                if (checkStorm(msgType)) return;

                let cmdToRun: Cmd = null;
                logger.debug(`Dispatching Msg: ${msgType}`, 'ENGINE', msg);
                set((state) => {
                    const [nextModel, cmd] = update(state.model, msg);
                    cmdToRun = cmd;
                    return { model: nextModel };
                });
                if (cmdToRun) executeCmds(cmdToRun);
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
                    const interval = setInterval(() => dispatch(msg), ms);
                    activeSubs.set(id, { type: 'EVERY', interval });
                }
            }

            if (sub.type === 'WATCH_STORE') {
                const { id, store, selector, msgCreator } = sub.payload;
                if (!activeSubs.has(id)) {
                    // Pre-calculamos el valor inicial
                    const initialValue = selector(store.getState().model || store.getState());
                    let lastValue = initialValue;

                    // Nos suscribimos a cambios futuros ANTES de disparar el mensaje inicial
                    // para evitar loops si el dispatch provoca un re-render que procese subs
                    const unsubscribe = store.subscribe((state: any) => {
                        const selectedValue = selector(state.model || state);
                        // Solo disparamos si el valor seleccionado ha cambiado (shallow comparison)
                        if (selectedValue !== lastValue) {
                            lastValue = selectedValue;
                            dispatch(msgCreator(selectedValue));
                        }
                    });

                    // Registramos la subscripción ANTES del dispatch inicial
                    activeSubs.set(id, { type: 'WATCH_STORE', unsubscribe, lastValue });

                    // Ahora disparamos el mensaje inicial de forma segura
                    dispatch(msgCreator(initialValue));
                }
            }

            if (sub.type === 'SSE') {
                const { id, url, msgCreator, headers } = sub.payload;
                if (!activeSubs.has(id)) {
                    logger.info(`Connecting to SSE stream: ${url}`, 'ENGINE');
                    try {
                        const eventSource = new EventSource(url, { headers });

                        eventSource.onmessage = (event) => {
                            try {
                                const data = JSON.parse(event.data);
                                logger.debug('SSE Message received', 'ENGINE', data);
                                dispatch(msgCreator(data));
                            } catch (e) {
                                logger.error('Error parsing SSE data', 'ENGINE', e);
                            }
                        };

                        eventSource.onerror = (error) => {
                            logger.error(`SSE Stream Error for ${id}`, 'ENGINE', error);
                        };

                        activeSubs.set(id, { type: 'SSE', eventSource });
                    } catch (e) {
                        logger.error(`Failed to create EventSource for ${id}`, 'ENGINE', e);
                    }
                }
            }
        };

        const cleanupSubs = (currentSubs: Set<string>) => {
            for (const [id, sub] of activeSubs.entries()) {
                if (!currentSubs.has(id)) {
                    if (sub.type === 'EVERY') {
                        clearInterval(sub.interval);
                    } else if (sub.type === 'WATCH_STORE') {
                        sub.unsubscribe();
                    } else if (sub.type === 'SSE') {
                        logger.info(`Disconnecting SSE stream: ${id}`, 'ENGINE');
                        sub.eventSource.close();
                    }
                    activeSubs.delete(id);
                }
            }
        };

        const getActiveIds = (sub: SubDescriptor<TMsg>, ids: Set<string> = new Set()): Set<string> => {
            if (sub.type === 'BATCH') {
                sub.payload.forEach((s: SubDescriptor<TMsg>) => getActiveIds(s, ids));
            } else if ((sub.type === 'EVERY' || sub.type === 'WATCH_STORE' || sub.type === 'SSE') && sub.payload.id) {
                ids.add(sub.payload.id);
            }
            return ids;
        };

        let lastIds = new Set<string>();

        const manageSubscriptions = (model: TModel, dispatch: (msg: TMsg) => void) => {
            const currentSub = subscriptions(model);
            const currentIds = getActiveIds(currentSub);

            // Evitar re-procesamiento si los IDs de las subscripciones no han cambiado
            const idsChanged = currentIds.size !== lastIds.size ||
                Array.from(currentIds).some(id => !lastIds.has(id));

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
