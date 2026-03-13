import { logger } from '../../utils/logger';
import { WebData } from './remote.data';
import { GlobalMsg } from './signal_bus';
import {
  ResourceListPayload,
  ResourceGetOnePayload,
  ResourceCreatePayload,
  ResourceUpdatePayload,
  ResourceDeletePayload,
  ResourcePayload
} from '../effects/resource.effect';

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

  /**
   * Envía un mensaje global (broadcast) que puede ser escuchado por cualquier
   * suscriptor usando Sub.receiveMsg.
   * Útil para comunicación desacoplada entre módulos.
   */
  sendMsg: (msg: GlobalMsg): CommandDescriptor => ({
    type: 'SEND_MSG',
    payload: msg
  }),

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

  task: (taskOrConfig: TaskConfig | ((...args: any[]) => Promise<any>), label?: string): CommandDescriptor => {
    let config: TaskConfig;

    if (typeof taskOrConfig === 'function') {
      config = {
        task: taskOrConfig,
        onSuccess: (x) => x,
        onFailure: (e) => ({ type: 'TASK_ERROR', error: e }),
        label: label
      };
    } else {
      config = taskOrConfig;
    }

    // Validate that the task is actually a function
    if (typeof config.task !== 'function') {
      log.error('Invalid task function - expected function', {
        got: typeof config.task,
        task: config.task,
        label: config.label
      });
      // Replace with a safe error-throwing function
      const safeTask = async () => {
        throw new Error(`Invalid task function provided to Cmd.task ${config.label ? `(${config.label})` : ''}`);
      };
      return {
        type: 'TASK',
        payload: { ...config, task: safeTask, label: config.label || 'safeTask' },
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

  /**
   * Maps a command from one message type to another.
   * Useful for composing TEA modules.
   */
  map: <SubMsg, Msg>(
    f: (subMsg: SubMsg) => Msg,
    cmd: Cmd
  ): Cmd => {
    if (!cmd) return null;
    if (Array.isArray(cmd)) {
      return cmd.map((c) => Cmd.map(f, c) as CommandDescriptor);
    }
    const descriptor = cmd as CommandDescriptor;
    switch (descriptor.type) {
      case 'HTTP':
        return {
          ...descriptor,
          payload: {
            ...descriptor.payload,
            msgCreator: (data: any) => f(descriptor.payload.msgCreator(data)),
            errorCreator: descriptor.payload.errorCreator
              ? (err: any) => f(descriptor.payload.errorCreator(err))
              : undefined,
          },
        };
      case 'TASK':
        return {
          ...descriptor,
          payload: {
            ...descriptor.payload,
            onSuccess: (data: any) => f(descriptor.payload.onSuccess(data)),
            onFailure: (err: any) => f(descriptor.payload.onFailure(err)),
          },
        };
      case 'RESOURCE':
        return {
          ...descriptor,
          payload: {
            ...descriptor.payload,
            msgCreator: (data: any) => f(descriptor.payload.msgCreator(data)),
          }
        };
      default:
        return descriptor;
    }
  },
};
