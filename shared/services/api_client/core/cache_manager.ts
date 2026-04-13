import { CacheEntry } from '../api_client.types';
import { logger } from '@/shared/utils/logger';

type CacheKeyInput = {
  method?: string;
  endpoint: string;
  body?: BodyInit | null;
  queryParams?: Record<string, any>;
};

export class CacheManager {
  private cache = new Map<string, CacheEntry>();

  buildKey(input: CacheKeyInput): string {
    const queryString = input.queryParams ? this.buildQueryString(input.queryParams) : '';
    return `${input.method || 'GET'}:${input.endpoint}${queryString}:${JSON.stringify(input.body || '')}`;
  }

  getQueryString(params?: Record<string, any>): string {
    if (!params) {
      return '';
    }
    return this.buildQueryString(params);
  }

  get<T>(key: string): T | null {
    if (!this.cache) {
      logger.error('[CacheManager] Cache map is undefined');
      return null;
    }
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }
    if ((Date.now() - cached.timestamp) >= cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T;
  }

  set(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  private buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach(v => query.append(key, String(v)));
      } else {
        query.append(key, String(value));
      }
    });
    const str = query.toString();
    return str ? `?${str}` : '';
  }
}
