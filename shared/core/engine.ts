import { create } from 'zustand';
import { SubDescriptor } from './sub';

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
                        console.log(`Engine: Executing Cmd ${singleCmd.type}`, singleCmd.payload ? '(with payload)' : '');
                        const result = await effectHandlers[singleCmd.type](singleCmd.payload, get().dispatch);
                        if (singleCmd.payload && singleCmd.payload.msgCreator) {
                            get().dispatch(singleCmd.payload.msgCreator(result));
                        }
                    } catch (error) {
                        if (singleCmd.payload && singleCmd.payload.errorCreator) {
                            get().dispatch(singleCmd.payload.errorCreator(error));
                        } else {
                            console.error(`Unhandled error in Cmd ${singleCmd.type}:`, error);
                        }
                    }
                }
            });
        };

        return {
            model: typeof initial === 'function' ? (initial as any)()[0] : initial,
            init: (params?: any) => {
                if (typeof initial === 'function') {
                    const [nextModel, cmd] = (initial as Function)(params);
                    set({ model: nextModel });
                    if (cmd) executeCmds(cmd);
                }
            },
            dispatch: (msg: TMsg) => {
                let cmdToRun: Cmd = null;
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
        };

        const cleanupSubs = (currentSubs: Set<string>) => {
            for (const [id, sub] of activeSubs.entries()) {
                if (!currentSubs.has(id)) {
                    if (sub.type === 'EVERY') {
                        clearInterval(sub.interval);
                    }
                    activeSubs.delete(id);
                }
            }
        };

        const getActiveIds = (sub: SubDescriptor<TMsg>, ids: Set<string> = new Set()): Set<string> => {
            if (sub.type === 'BATCH') {
                sub.payload.forEach((s: SubDescriptor<TMsg>) => getActiveIds(s, ids));
            } else if (sub.type === 'EVERY' && sub.payload.id) {
                ids.add(sub.payload.id);
            }
            return ids;
        };

        // Suscribirse a los cambios del modelo para actualizar subscripciones
        store.subscribe((state) => {
            const currentSub = subscriptions(state.model);
            const currentIds = getActiveIds(currentSub);

            cleanupSubs(currentIds);
            processSub(currentSub, state.dispatch);
        });
    }

    return store;
};
