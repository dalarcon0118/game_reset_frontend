export class TransportError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly method: string,
    public readonly timeout: number,
    public readonly status?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TransportError';
  }
}

export class NetworkError extends TransportError {
  constructor(url: string, method: string, timeout: number, cause: Error) {
    super('Network failure', url, method, timeout, undefined, cause);
    this.name = 'NetworkError';
  }
}

export class HttpError extends TransportError {
  constructor(url: string, method: string, timeout: number, status: number) {
    super(`HTTP ${status}`, url, method, timeout, status);
    this.name = 'HttpError';
  }
}

export class TimeoutError extends TransportError {
  constructor(url: string, method: string, timeout: number) {
    super(`Request timeout after ${timeout}ms`, url, method, timeout);
    this.name = 'TimeoutError';
  }
}

export class AbortError extends TransportError {
  constructor(url: string, method: string, timeout: number) {
    super('Request aborted', url, method, timeout);
    this.name = 'AbortError';
  }
}