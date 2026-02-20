import { ErrorHandler } from './error_handler';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
}

export type RetryResult<T> = 
  | { success: true; data: T; attempts: number }
  | { success: false; error: Error; attempts: number };

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  jitter: true
};

const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

const calculateDelay = (attempt: number, options: Required<RetryOptions>): number => {
  const exponentialDelay = options.baseDelay * Math.pow(2, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  if (!options.jitter) return cappedDelay;
  
  const jitter = Math.random() * 0.3 * cappedDelay;
  return Math.floor(cappedDelay + jitter);
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...defaultOptions, ...options };
  
  const executeAttempt = async (attempt: number): Promise<RetryResult<T>> => {
    try {
      const data = await operation();
      return { success: true, data, attempts: attempt };
    } catch (error) {
      if (!ErrorHandler.isRetryable(error) || attempt >= opts.maxAttempts) {
        return { 
          success: false, 
          error: error instanceof Error ? error : new Error(String(error)),
          attempts: attempt 
        };
      }
      
      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
      return executeAttempt(attempt + 1);
    }
  };
  
  return executeAttempt(1);
}

export const retry = withRetry;