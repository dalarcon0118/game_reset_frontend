import apiClient from '@/shared/services/api_client';
import { logger } from '../../utils/logger';

const log = logger.withTag('HTTP_EFFECT');

export interface HttpPayload {
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  cacheTTL?: number;
  retryCount?: number;
  abortSignal?: AbortSignal;
  msgCreator?: any;
}

export async function handleHttp(payload: HttpPayload) {
  if (!payload) {
    log.error('HTTP Request failed - missing payload');
    throw new Error('HTTP effect requires a payload');
  }
  const { url, method, body, headers, cacheTTL, retryCount, abortSignal } = payload;

  try {
    const response = await apiClient.request(url, {
      method,
      body,
      headers,
      cacheTTL,
      retryCount,
      abortSignal,
    });
    return response;
  } catch (error) {
    log.error('HTTP Request failed', error, { method, url });
    throw error;
  }
}