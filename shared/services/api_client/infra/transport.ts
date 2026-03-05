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
      return await fetch(url, {
        ...config,
        signal: controller.signal
      });
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
