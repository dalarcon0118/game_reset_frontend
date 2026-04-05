export class Transport {
  private pendingRequests: Map<string, Promise<Response>> = new Map();
  
  // FASE 2 FIX: Cache de respuestas para request coalescing
  private responseCache: Map<string, { response: Response; timestamp: number }> = new Map();
  private static readonly CACHE_TTL_MS = 2000; // 2 segundos de cache para requests idénticas
  
  // Métricas de deduplicación
  private dedupCounter = 0;
  private cacheHitCounter = 0;

  /**
   * Generates a unique key for request deduplication
   */
  private getRequestKey(url: string, config: RequestInit): string {
    const method = config.method || 'GET';
    const body = config.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${body}`;
  }
  
  /**
   * Limpia entradas de cache expiradas
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.responseCache) {
      if (now - entry.timestamp > Transport.CACHE_TTL_MS) {
        this.responseCache.delete(key);
      }
    }
  }
  
  /**
   * Obtiene métricas de deduplicación para debugging
   */
  getMetrics(): { dedupCount: number; cacheHitCount: number; pendingCount: number; cacheSize: number } {
    return {
      dedupCount: this.dedupCounter,
      cacheHitCount: this.cacheHitCounter,
      pendingCount: this.pendingRequests.size,
      cacheSize: this.responseCache.size
    };
  }

  async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number,
    abortSignal?: AbortSignal
  ): Promise<Response> {
    const requestKey = this.getRequestKey(url, config);
    const now = Date.now();

    // FASE 2 FIX: Verificar cache de respuestas primero
    const cached = this.responseCache.get(requestKey);
    if (cached && (now - cached.timestamp) < Transport.CACHE_TTL_MS) {
      this.cacheHitCounter++;
      console.log(`[TRANSPORT] Cache hit (${this.cacheHitCounter} hits): ${config.method || 'GET'} ${url}`);
      return cached.response.clone();
    }

    // Deduplication: Return existing promise if same request is already in flight
    // We clone the response to allow multiple callers to read the body independently (SSOT)
    if (this.pendingRequests.has(requestKey)) {
      this.dedupCounter++;
      console.log(`[TRANSPORT] Deduplicating request (${this.dedupCounter} deduped): ${config.method || 'GET'} ${url}`);
      return this.pendingRequests.get(requestKey)!.then(res => res.clone());
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const unbindAbort = this.bindAbortSignal(abortSignal, controller);

    const requestPromise = (async () => {
      try {
        console.log(`[TRANSPORT] Fetching: ${config.method || 'GET'} ${url}`);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });
        console.log(`[TRANSPORT] Response: ${response.status} ${url}`);
        
        // FASE 2 FIX: Guardar en cache si es GET exitoso
        if ((config.method || 'GET') === 'GET' && response.ok) {
          this.responseCache.set(requestKey, {
            response: response.clone(),
            timestamp: Date.now()
          });
          // Limpiar cache expirado periódicamente
          if (this.responseCache.size > 10) {
            this.cleanExpiredCache();
          }
        }
        
        return response;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error(`[TRANSPORT] Timeout/Abort fetching ${url} after ${timeout}ms`);
        } else {
          console.error(`[TRANSPORT] Error fetching ${url}:`, error.message, error.stack);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
        unbindAbort();
        // Remove from pending requests when done
        this.pendingRequests.delete(requestKey);
      }
    })();

    // Store the promise for deduplication
    this.pendingRequests.set(requestKey, requestPromise);

    return requestPromise.then(res => res.clone());
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
