import { logger } from '@/shared/utils/logger';

const CACHE_MAX_SIZE = 10;
const CACHE_TTL_MS = 2000;

interface CachedEntry {
  response: Response;
  timestamp: number;
}

export class ResponseCache {
  private cache: Map<string, CachedEntry> = new Map();

  get(key: string): Response | null {
    if (!this.cache) {
      logger.error('[ResponseCache] Cache map is undefined');
      return null;
    }
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.response.clone();
  }

  set(key: string, response: Response): void {
    if (this.cache.size >= CACHE_MAX_SIZE) {
      this.cleanExpired();
    }
    this.cache.set(key, { response: response.clone(), timestamp: Date.now() });
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}