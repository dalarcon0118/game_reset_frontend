import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TRANSPORT');

export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<Response>> = new Map();
  private dedupCounter = 0;

  getOrCreate(key: string, factory: () => Promise<Response>): Promise<Response> {
    if (!this.pendingRequests) {
      log.error('[RequestDeduplicator] pendingRequests map is undefined');
      this.pendingRequests = new Map();
    }
    const existing = this.pendingRequests.get(key);
    if (existing) {
      this.dedupCounter++;
      log.debug(`Deduplicating request (${this.dedupCounter} deduped): ${key}`);
      return existing.then(res => res.clone());
    }

    const promise = factory();
    this.pendingRequests.set(key, promise);

    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise.then(res => res.clone());
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  getDedupCount(): number {
    return this.dedupCounter;
  }
}