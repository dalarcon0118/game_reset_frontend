/**
 * Extensión de comandos (Cmd) usando tipos algebraicos
 * 
 * Esta extensión mejora la gestión de efectos secundarios en TEA
 * utilizando tipos algebraicos para mayor seguridad de tipos.
 */

import { Cmd as CoreCmd, CommandDescriptor } from './cmd';
import { Maybe, Either, Result } from './algebraic-types';
import { logger } from '../utils/logger';

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
          if (result._tag === 'Right') {
            return result.right;
          } else {
            throw result.left;
          }
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
   * Cmd para operaciones que pueden tener éxito o fallar (similar a Either)
   */
  eitherTask: <L, R>(
    config: {
      task: (...args: any[]) => Promise<Either<L, R>>;
      args?: any[];
      onRight: (data: R) => any;
      onLeft: (error: L) => any;
      label?: string;
    }
  ): AlgebraicCommandDescriptor => {
    if (typeof config.task !== 'function') {
      log.error('Invalid task function - expected function', {
        got: typeof config.task,
        task: config.task
      });
      config.task = async () => { throw new Error('Invalid task function provided to AlgebraicCmd.eitherTask'); };
    }
    
    return {
      type: 'EITHER_TASK',
      payload: {
        ...config,
        task: async () => {
          const eitherResult = await config.task(...(config.args || []));
          if (eitherResult._tag === 'Right') {
            return eitherResult.right;
          } else {
            throw eitherResult.left;
          }
        }
      }
    };
  },

  /**
   * Cmd para realizar llamadas HTTP que devuelven Result
   */
 resultHttp: <E, T>(
    config: {
      url: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      cacheTTL?: number;
      retryCount?: number;
      abortSignal?: AbortSignal;
    },
    onSuccess: (data: T) => any,
    onFailure: (error: E) => any
  ): AlgebraicCommandDescriptor => ({
    type: 'RESULT_HTTP',
    payload: {
      ...config,
      method: config.method || 'GET',
      onSuccess,
      onFailure
    }
  }),

  /**
   * Cmd para operaciones asíncronas que devuelven Maybe
   */
  maybeHttp: <T>(
    config: {
      url: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
    },
    onJust: (data: T) => any,
    onNothing: () => any
  ): AlgebraicCommandDescriptor => ({
    type: 'MAYBE_HTTP',
    payload: {
      ...config,
      method: config.method || 'GET',
      onJust,
      onNothing
    }
  })
};

// Exportar una versión combinada que incluya ambas funcionalidades
export const ExtendedCmd = {
  ...CoreCmd,
  ...AlgebraicCmd
};