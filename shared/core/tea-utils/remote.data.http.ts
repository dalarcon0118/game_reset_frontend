import { logger } from '../utils/logger';
import { RemoteData, WebData } from './remote.data';
import { Cmd } from './tea-utils/cmd';
import { Result } from 'neverthrow';

const log = logger.withTag('REMOTE_DATA_HTTP');

// Log de diagnóstico para verificar que RemoteData está disponible
log.debug('RemoteDataHttp module loaded', {
  hasRemoteData: typeof RemoteData !== 'undefined',
  remoteDataKeys: typeof RemoteData !== 'undefined' ? Object.keys(RemoteData) : 'N/A'
});

/**
 * Configuration for the HTTP request.
 */
export interface HttpConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  cacheTTL?: number;
  retryCount?: number;
  abortSignal?: AbortSignal;
}

/**
 * RemoteData.Http provides helpers to create commands that result in a WebData message.
 * This allows for a very clean 'update' logic where you just assign the payload.
 */
export const RemoteDataHttp = {
  /**
   * Generic request helper.
   * Returns a Cmd that dispatches the msgCreator with the resulting WebData.
   */
  request: <T, Msg>(
    config: HttpConfig,
    msgCreator: (data: WebData<T>) => Msg,
    fetchFn: (config: HttpConfig) => Promise<T>
  ): Cmd => {
    return Cmd.task({
      task: () => fetchFn(config),
      onSuccess: (data: T) => msgCreator(RemoteData.success(data)),
      onFailure: (error: any) => msgCreator(RemoteData.failure(error)),
    });
  },

  /**
   * GET request helper.
   */
  get: <T, Msg>(
    url: string,
    msgCreator: (data: WebData<T>) => Msg,
    fetchFn: (config: HttpConfig) => Promise<T>,
    headers?: Record<string, string>
  ): Cmd => {
    return RemoteDataHttp.request({ url, method: 'GET', headers }, msgCreator, fetchFn);
  },

  /**
   * POST request helper.
   */
  post: <T, Msg>(
    url: string,
    body: any,
    msgCreator: (data: WebData<T>) => Msg,
    fetchFn: (config: HttpConfig) => Promise<T>,
    headers?: Record<string, string>
  ): Cmd => {
    return RemoteDataHttp.request({ url, method: 'POST', body, headers }, msgCreator, fetchFn);
  },

  /**
   * PUT request helper.
   */
  put: <T, Msg>(
    url: string,
    body: any,
    msgCreator: (data: WebData<T>) => Msg,
    fetchFn: (config: HttpConfig) => Promise<T>,
    headers?: Record<string, string>
  ): Cmd => {
    return RemoteDataHttp.request({ url, method: 'PUT', body, headers }, msgCreator, fetchFn);
  },

  /**
   * PATCH request helper.
   */
  patch: <T, Msg>(
    url: string,
    body: any,
    msgCreator: (data: WebData<T>) => Msg,
    fetchFn: (config: HttpConfig) => Promise<T>,
    headers?: Record<string, string>
  ): Cmd => {
    return RemoteDataHttp.request({ url, method: 'PATCH', body, headers }, msgCreator, fetchFn);
  },

  /**
   * DELETE request helper.
   */
  delete: <T, Msg>(
    url: string,
    msgCreator: (data: WebData<T>) => Msg,
    fetchFn: (config: HttpConfig) => Promise<T>,
    headers?: Record<string, string>
  ): Cmd => {
    return RemoteDataHttp.request({ url, method: 'DELETE', headers }, msgCreator, fetchFn);
  },

  /**
   * Wraps a promise-based task (like a Service call) into a Cmd that dispatches
   * a message with the result as WebData.
   */
  fetch: <T, Msg>(
    task: () => Promise<T | [any, T] | Result<T, any>>,
    msgCreator: (data: WebData<T>) => Msg,
    label?: string
  ): Cmd => {
    // Validate that task is actually a function
    if (typeof task !== 'function') {
      log.error('Invalid task parameter - expected function', {
        type: typeof task,
        task,
        label
      });
      return Cmd.task({
        task: async () => { throw new Error(`Invalid task function provided to RemoteDataHttp.fetch ${label ? `(${label})` : ''}`); },
        onSuccess: (data: T) => msgCreator(RemoteData.success(data)),
        onFailure: (error: any) => msgCreator(RemoteData.failure(error)),
        label: label ? `${label}_ERROR` : 'UNKNOWN_ERROR'
      });
    }

    const wrappedTask = async () => {
      // DIAGNOSTIC LOG: Verificar RemoteData en el scope del task
      log.debug('RemoteDataHttp.fetch task executing', {
        hasRemoteData: typeof RemoteData !== 'undefined',
        label: label || 'REMOTE_DATA_HTTP_FETCH'
      });

      try {
        const result = await task();

        // Check for Result pattern (neverthrow)
        if (result && typeof (result as any).isOk === 'function' && typeof (result as any).isErr === 'function') {
          if ((result as any).isErr()) {
            throw (result as any).error;
          }
          return (result as any).value;
        }

        // Check for [error, data] pattern (Golang style)
        if (Array.isArray(result) && result.length === 2) {
          const [error, data] = result;
          if (error) throw error;
          return data;
        }

        return result as T;
      } catch (error) {
        log.error(`Fetch task failed: ${label || 'unlabeled'}`, error);
        throw error;
      }
    };

    return Cmd.task({
      task: wrappedTask,
      onSuccess: (data: T) => msgCreator(RemoteData.success(data)),
      onFailure: (error: any) => msgCreator(RemoteData.failure(error)),
      label: label
    });
  }
};
