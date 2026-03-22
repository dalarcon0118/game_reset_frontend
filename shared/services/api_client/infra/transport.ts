export class Transport {
  async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number,
    abortSignal?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const unbindAbort = this.bindAbortSignal(abortSignal, controller);

    try {
      console.log(`[TRANSPORT] Fetching: ${config.method || 'GET'} ${url}`);
      // Log headers and body for debugging in tests if needed
      // console.log('[TRANSPORT] Config:', JSON.stringify(config, null, 2));
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      console.log(`[TRANSPORT] Response: ${response.status} ${url}`);
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
