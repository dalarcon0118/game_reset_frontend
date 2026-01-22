import { RemoteData, WebData } from './remote.data';
import { Cmd } from './cmd';

/**
 * Configuration for the HTTP request.
 */
export interface HttpConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
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
    task: () => Promise<T | [any, T]>,
    msgCreator: (data: WebData<T>) => Msg
  ): Cmd => {
    // Validate that task is actually a function
    if (typeof task !== 'function') {
      console.error('[RemoteDataHttp.fetch] Invalid task parameter - expected function, got:', typeof task, task);
      return Cmd.task({
        task: async () => { throw new Error('Invalid task function provided to RemoteDataHttp.fetch'); },
        onSuccess: (data: T) => msgCreator(RemoteData.success(data)),
        onFailure: (error: any) => msgCreator(RemoteData.failure(error)),
      });
    }

    return Cmd.task({
      task: async () => {
        const result = await task();
        // If it's the [error, data] tuple from our to() helper
        if (Array.isArray(result) && result.length === 2) {
          const [error, data] = result;
          if (error) throw error;
          return data;
        }
        return result as T;
      },
      onSuccess: (data: T) => msgCreator(RemoteData.success(data)),
      onFailure: (error: any) => msgCreator(RemoteData.failure(error)),
    });
  }
};
