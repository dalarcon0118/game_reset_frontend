
/**
 * Extensión de comandos (Cmd) usando tipos algebraicos
 * 
 * Esta extensión mejora la gestión de efectos secundarios en TEA
 * utilizando tipos algebraicos para mayor seguridad de tipos.
 */

import { Cmd as CoreCmd, CommandDescriptor } from './tea-utils/cmd';
import { Maybe, Either, Result } from './algebraic-types';
import { logger } from '../utils/logger';
import { ListParams } from './architecture/interfaces';

const log = logger.withTag('CMD_ALGEBRAIC');

export interface AlgebraicCommandDescriptor extends CommandDescriptor {
  type: string;
  payload?: any;
}

export type AlgebraicCmd = AlgebraicCommandDescriptor | AlgebraicCommandDescriptor[] | null;

/**
 * Extensión del sistema de comandos con tipos algebraicos
 */
export const AlgebraicCmd = {
  ...CoreCmd, // Mantener la funcionalidad existente

  /**
   * Cmd que maneja operaciones que pueden fallar, representadas como Result
   */
  resultTask: <E, T>(
    config: {
      task: (...args: any[]) => Promise<Result<E, T>>;
      args?: any[];
      onSuccess: (data: T) => any;
      onFailure: (error: E) => any;
      label?: string;
    }
  ): AlgebraicCommandDescriptor => {
    if (typeof config.task !== 'function') {
      log.error('Invalid task function - expected function', {
        got: typeof config.task,
        task: config.task
      });
      config.task = async () => { throw new Error('Invalid task function provided to AlgebraicCmd.resultTask'); };
    }

    return {
      type: 'RESULT_TASK',
      payload: {
        ...config,
        task: async () => {
          const result = await config.task(...(config.args || []));
          return result;
        }
      }
    };
  },

  /**
   * Cmd que maneja operaciones que pueden retornar un valor opcional, representado como Maybe
   */
  maybeTask: <T>(
    config: {
      task: (...args: any[]) => Promise<Maybe<T>>;
      args?: any[];
      onJust: (data: T) => any;
      onNothing: () => any;
      label?: string;
    }
  ): AlgebraicCommandDescriptor => {
    if (typeof config.task !== 'function') {
      log.error('Invalid task function - expected function', {
        got: typeof config.task,
        task: config.task
      });
      config.task = async () => { throw new Error('Invalid task function provided to AlgebraicCmd.maybeTask'); };
    }

    return {
      type: 'MAYBE_TASK',
      payload: {
        ...config,
        task: async () => {
          const maybeResult = await config.task(...(config.args || []));
          if (maybeResult._tag === 'Just') {
            return maybeResult.value;
          } else {
            // Devolvemos un valor especial para indicar que fue Nothing
            return { __maybe_nothing__: true };
          }
        }
      }
    };
  },

  /**
   * Resource Commands (Refine-like Data Provider Integration)
   */
  resource: {
    /**
     * Get a list of resources with pagination, sorting and filtering
     */
    list: <T, Msg>(
      resource: string,
      params: ListParams | undefined,
      msgConstructor: (result: Result<T[], any>) => Msg
    ): AlgebraicCommandDescriptor => ({
      type: 'RESOURCE_LIST',
      payload: {
        resource,
        params,
        onSuccess: (data: { data: T[], total: number }) => msgConstructor({ _tag: 'Right', right: data.data }), // We unwrap data structure here for simplicity or keep it? Let's keep data only for now or adapt
        onFailure: (error: any) => msgConstructor({ _tag: 'Left', left: error })
      }
    }),

    /**
     * Get a single resource by ID
     */
    getOne: <T, Msg>(
      resource: string,
      id: string | number,
      msgConstructor: (result: Result<T, any>) => Msg
    ): AlgebraicCommandDescriptor => ({
      type: 'RESOURCE_GET_ONE',
      payload: {
        resource,
        id,
        onSuccess: (data: T) => msgConstructor({ _tag: 'Right', right: data }),
        onFailure: (error: any) => msgConstructor({ _tag: 'Left', left: error })
      }
    }),

    /**
     * Create a new resource
     */
    create: <T, Msg>(
      resource: string,
      variables: any,
      msgConstructor: (result: Result<T, any>) => Msg
    ): AlgebraicCommandDescriptor => ({
      type: 'RESOURCE_CREATE',
      payload: {
        resource,
        variables,
        onSuccess: (data: T) => msgConstructor({ _tag: 'Right', right: data }),
        onFailure: (error: any) => msgConstructor({ _tag: 'Left', left: error })
      }
    }),

    /**
     * Update an existing resource
     */
    update: <T, Msg>(
      resource: string,
      id: string | number,
      variables: any,
      msgConstructor: (result: Result<T, any>) => Msg
    ): AlgebraicCommandDescriptor => ({
      type: 'RESOURCE_UPDATE',
      payload: {
        resource,
        id,
        variables,
        onSuccess: (data: T) => msgConstructor({ _tag: 'Right', right: data }),
        onFailure: (error: any) => msgConstructor({ _tag: 'Left', left: error })
      }
    }),

    /**
     * Delete a resource
     */
    delete: <T, Msg>(
      resource: string,
      id: string | number,
      msgConstructor: (result: Result<T, any>) => Msg
    ): AlgebraicCommandDescriptor => ({
      type: 'RESOURCE_DELETE',
      payload: {
        resource,
        id,
        onSuccess: (data: T) => msgConstructor({ _tag: 'Right', right: data }),
        onFailure: (error: any) => msgConstructor({ _tag: 'Left', left: error })
      }
    })
  }
};
