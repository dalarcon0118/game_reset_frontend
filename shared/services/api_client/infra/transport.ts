import { logger } from '@/shared/utils/logger';
import { ResponseCache } from './response-cache';
import { RequestDeduplicator } from './request-deduplicator';
import {
  TransportError,
  NetworkError,
  TimeoutError,
  AbortError
} from './errors';

const log = logger.withTag('TRANSPORT');

export class Transport {
  private responseCache = new ResponseCache();
  private deduplicator = new RequestDeduplicator();
  private cacheHitCounter = 0;

  getMetrics(): { dedupCount: number; cacheHitCount: number; pendingCount: number; cacheSize: number } {
    return {
      dedupCount: this.deduplicator.getDedupCount(),
      cacheHitCount: this.cacheHitCounter,
      pendingCount: this.deduplicator.getPendingCount(),
      cacheSize: this.responseCache.size
    };
  }

  private getRequestKey(url: string, config: RequestInit): string {
    const method = (config.method || 'GET').toUpperCase();
    let body = '';
    if (config.body) {
      if (typeof config.body === 'string') {
        body = config.body;
      } else {
        body = JSON.stringify(config.body);
      }
    }
    return `${method}:${url}:${body}`;
  }

  async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number,
    abortSignal?: AbortSignal
  ): Promise<Response> {
    const requestKey = this.getRequestKey(url, config);
    const method = config.method || 'GET';

    const cached = this.responseCache.get(requestKey);
    if (cached) {
      this.cacheHitCounter++;
      log.debug(`Cache hit (${this.cacheHitCounter} hits): ${method} ${url}`);
      return cached;
    }

    return this.deduplicator.getOrCreate(
      requestKey,
      () => this.executeRequest(url, config, timeout, abortSignal, requestKey)
    );
  }

  private async executeRequest(
    url: string,
    config: RequestInit,
    timeout: number,
    abortSignal: AbortSignal | undefined,
    requestKey: string
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const unbindAbort = this.bindAbortSignal(abortSignal, controller);
    const method = (config.method || 'GET').toUpperCase();

    try {
      log.debug(`Fetching: ${method} ${url}`);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      log.debug(`Response: ${response.status} ${url}`);

      if (method === 'GET') {
        this.responseCache.set(requestKey, response);
      }

      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        const isTimeout = !abortSignal || abortSignal.aborted;
        if (isTimeout) {
          throw new TimeoutError(url, method, timeout);
        }
        throw new AbortError(url, method, timeout);
      }

      if (error.message === 'Network request failed' || error.message.includes('fetch')) {
        throw new NetworkError(url, method, timeout, error);
      }

      throw new TransportError(error.message || 'Unknown error', url, method, timeout, undefined, error);
    } finally {
      clearTimeout(timeoutId);
      unbindAbort();
    }
  }

  private bindAbortSignal(externalSignal: AbortSignal | undefined, controller: AbortController): () => void {
    if (!externalSignal) {
      return () => { };
    }

    const onAbort = () => controller.abort();
    if (externalSignal.aborted) {
      controller.abort();
      return () => { };
    }

    externalSignal.addEventListener('abort', onAbort);
    return () => externalSignal.removeEventListener('abort', onAbort);
  }
}

export { TransportError, NetworkError, HttpError, TimeoutError, AbortError } from './errors';
export { ResponseCache } from './response-cache';
export { RequestDeduplicator } from './request-deduplicator';
