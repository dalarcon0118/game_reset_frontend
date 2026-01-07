
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
    }, msgCreator: (data: any) => any): { type: string; payload: any } => ({
        type: 'HTTP',
        payload: { ...config, method: config.method || 'GET', msgCreator }
    }),
    task: (config: TaskConfig): CommandDescriptor => ({
        type: 'TASK',
        payload: config
    }),
    attempt: (config: AttemptConfig): CommandDescriptor => ({
        type: 'ATTEMPT',
        payload: config
    }),
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
    })
};