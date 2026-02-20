import { logger } from '../utils/logger';
import { WebData } from './remote.data';
import {
  ResourceListPayload,
  ResourceGetOnePayload,
  ResourceCreatePayload,
  ResourceUpdatePayload,
  ResourceDeletePayload,
  ResourcePayload
} from './effects/resource.effect';

const log = logger.withTag('CMD_CORE');

export interface CommandDescriptor {
  type: string;
  payload?: any;
}

export type Cmd = CommandDescriptor | CommandDescriptor[] | null | undefined;

export interface TaskConfig {
  task: (...args: any[]) => Promise<any>;
  args?: any[];
  onSuccess: (data: any) => any;
  onFailure: (error: any) => any;
  label?: string; // For debugging/testing
}

// --- Resource Payload Constructors (Messages) ---
// These helpers create the payload expected by the RESOURCE effect handler.
// They align with the pattern: Cmd.resource(ListMsg({ ... }))

export const ListMsg = <T>(
  config: { resource: string; params?: any },
  msgCreator: (data: WebData<T>) => any
): ResourceListPayload => ({
  operation: 'LIST',
  resource: config.resource,
  params: config.params,
  msgCreator: msgCreator as (data: WebData<any>) => any,
});

export const GetOneMsg = <T>(
  config: { resource: string; id: string | number },
  msgCreator: (data: WebData<T>) => any
): ResourceGetOnePayload => ({
  operation: 'GET_ONE',
  resource: config.resource,
  id: config.id,
  msgCreator: msgCreator as (data: WebData<any>) => any,
});

export const CreateMsg = <T>(
  config: { resource: string; variables: any },
  msgCreator: (data: WebData<T>) => any
): ResourceCreatePayload => ({
  operation: 'CREATE',
  resource: config.resource,
  variables: config.variables,
  msgCreator: msgCreator as (data: WebData<any>) => any,
});

export const UpdateMsg = <T>(
  config: { resource: string; id: string | number; variables: any },
  msgCreator: (data: WebData<T>) => any
): ResourceUpdatePayload => ({
  operation: 'UPDATE',
  resource: config.resource,
  id: config.id,
  variables: config.variables,
  msgCreator: msgCreator as (data: WebData<any>) => any,
});

export const DeleteMsg = <T>(
  config: { resource: string; id: string | number },
  msgCreator: (data: WebData<T>) => any
): ResourceDeletePayload => ({
  operation: 'DELETE',
  resource: config.resource,
  id: config.id,
  msgCreator: msgCreator as (data: WebData<any>) => any,
});

export const Cmd = {
  none: null,

  http: (
    config: {
      url: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      cacheTTL?: number;
      retryCount?: number;
      abortSignal?: AbortSignal;
    },
    msgCreator: (data: any) => any,
    errorCreator?: (error: any) => any
  ): CommandDescriptor => ({
    type: 'HTTP',
    payload: {
      ...config,
      method: config.method || 'GET',
      msgCreator,
      errorCreator,
    },
  }),

  task: (config: TaskConfig): CommandDescriptor => {
    // Validate that the task is actually a function
    if (typeof config.task !== 'function') {
      log.error('Invalid task function - expected function', {
        got: typeof config.task,
        task: config.task,
      });
      // Replace with a safe error-throwing function
      const safeTask = async () => {
        throw new Error('Invalid task function provided to Cmd.task');
      };
      return {
        type: 'TASK',
        payload: { ...config, task: safeTask },
      };
    }
    return {
      type: 'TASK',
      payload: config,
    };
  },

  sleep: (ms: number, msg: any): CommandDescriptor => ({
    type: 'TASK',
    payload: {
      task: () => new Promise((resolve) => setTimeout(() => resolve(msg), ms)),
      onSuccess: (m: any) => m,
      onFailure: (err: any) => ({ type: 'ERROR', error: err }),
    },
  }),

  ofMsg: (msg: any): CommandDescriptor => Cmd.sleep(0, msg),

  batch: (cmds: (Cmd | null | undefined)[]): Cmd => {
    const flat: CommandDescriptor[] = [];
    for (const c of cmds) {
      if (!c) continue;
      if (Array.isArray(c)) {
        flat.push(...c);
      } else {
        flat.push(c);
      }
    }
    return flat;
  },

  attempt: (config: TaskConfig): CommandDescriptor => Cmd.task(config),

  navigate: (
    pathOrConfig: string | { pathname: string; params?: any; method?: 'push' | 'replace' | 'back' }
  ): CommandDescriptor => {
    let payload;
    if (typeof pathOrConfig === 'string') {
      payload = { pathname: pathOrConfig };
    } else {
      payload = pathOrConfig;
    }
    return {
      type: 'NAVIGATE',
      payload,
    };
  },

  back: (): CommandDescriptor => ({
    type: 'NAVIGATE',
    payload: { method: 'back', pathname: '' },
  }),

  alert: (config: {
    title: string;
    message?: string;
    buttons?: {
      text: string;
      onPressMsg?: any;
      style?: 'default' | 'cancel' | 'destructive';
    }[];
    options?: { cancelable: boolean };
  }): CommandDescriptor => ({
    type: 'ALERT',
    payload: config,
  }),

  // --- Resource Commands (Standardized with WebData) ---
  resource: (payload: ResourcePayload): CommandDescriptor => ({
    type: 'RESOURCE',
    payload,
  }),
};
