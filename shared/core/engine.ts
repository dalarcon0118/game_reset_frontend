import { create } from 'zustand';
// Un comando es un descriptor que el Engine puede ejecutar usando effectHandlers
export interface CommandDescriptor {
    type: string;
    payload?: any;
}

export type Cmd = CommandDescriptor | CommandDescriptor[] | null | undefined;

// La estructura que debe devolver cualquier función 'update'
export type UpdateResult<TModel, TMsg> = [TModel, Cmd?];



export const createElmStore = <TModel, TMsg>(
    initialModel: TModel,
    update: (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>,
    effectHandlers: Record<string, (payload: any, dispatch: (msg: TMsg) => void) => Promise<any>>
) => {
    return create<{ model: TModel; dispatch: (msg: TMsg) => void }>((set, get) => ({
        model: initialModel,
        dispatch: async (msg: TMsg) => {
            // 1. Ejecutar lógica pura
            const [nextModel, cmd] = update(get().model, msg);

            // 2. Actualizar estado
            set({ model: nextModel });

            const cmdsToExecute = Array.isArray(cmd) ? cmd : cmd ? [cmd] : [];

            // 3. Si hay un comando, el motor lo ejecuta sin saber qué hace
            cmdsToExecute.forEach(async (singleCmd: any) => {
                if (singleCmd && effectHandlers[singleCmd.type]) {
                    // El motor delega la ejecución al handler correspondiente
                    // Pasamos el dispatch para que handlers como TASK puedan usarlo
                    const result = await effectHandlers[singleCmd.type](singleCmd.payload, get().dispatch);

                    // Si el comando requiere una respuesta simple vía msgCreator, el motor hace el re-dispatch
                    if (singleCmd.payload && singleCmd.payload.msgCreator) {
                        get().dispatch(singleCmd.payload.msgCreator(result));
                    }
                }
            })
        },
    }));
};