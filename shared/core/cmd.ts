
export interface CommandDescriptor {
    type: string;
    payload?: any;
}
export type Cmd = CommandDescriptor | CommandDescriptor[] | null;

export interface TaskConfig {
    task: (...args: any[]) => Promise<any>,
    args?: any[],
    onSuccess: (data: any) => any,
    onFailure: (error: any) => any
}

export interface AttemptConfig {
    task: (...args: any[]) => Promise<[any, any]>,
    args?: any[],
    onSuccess: (data: any) => any,
    onFailure: (error: any) => any
}

export const Cmd = {
    none: null,
    // Ahora permite method, body, headers, etc.
    http: (config: {
        url: string,
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
        body?: any,
        headers?: Record<string, string>
    }, msgCreator: (data: any) => any, errorCreator?: (error: any) => any): { type: string; payload: any } => ({
        type: 'HTTP',
        payload: { ...config, method: config.method || 'GET', msgCreator, errorCreator }
    }),
    task: (config: TaskConfig): CommandDescriptor => {
        // Validate that the task is actually a function
        if (typeof config.task !== 'function') {
            console.error('[Cmd.task] Invalid task function - expected function, got:', typeof config.task, config.task);
            // Replace with a safe error-throwing function
            config.task = async () => { throw new Error('Invalid task function provided to Cmd.task'); };
        }
        return {
            type: 'TASK',
            payload: config
        };
    },
    attempt: (config: AttemptConfig): CommandDescriptor => ({
        type: 'ATTEMPT',
        payload: config
    }),
    /**
     * Agrupa múltiples comandos en uno solo.
     * El motor (Engine) ya está preparado para manejar arreglos de comandos.
     */
    batch: (cmds: (Cmd | undefined)[]): CommandDescriptor[] => {
        const flat: CommandDescriptor[] = [];
        cmds.forEach(cmd => {
            if (!cmd) return;
            if (Array.isArray(cmd)) {
                flat.push(...cmd);
            } else {
                flat.push(cmd);
            }
        });
        return flat;
    },
    navigate: (config: {
        pathname: string,
        params?: Record<string, any>,
        method?: 'push' | 'replace' | 'back'
    }): CommandDescriptor => ({
        type: 'NAVIGATE',
        payload: config
    }),
    sleep: (ms: number, msg: any): CommandDescriptor => ({
        type: 'SLEEP',
        payload: { ms, msg }
    }),
    alert: (config: {
        title: string,
        message: string,
        buttons?: {
            text: string,
            onPressMsg?: any,
            style?: 'default' | 'cancel' | 'destructive'
        }[]
    }): CommandDescriptor => ({
        type: 'ALERT',
        payload: config
    })
};
