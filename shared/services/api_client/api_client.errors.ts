export interface ApiClientErrorData {
  error_type?: string;
  message?: string;
  context?: any;
  detail?: string;
  retry_after?: number; // For 429 errors
  [key: string]: any;
}

export class ApiClientError extends Error {
  status: number;
  data: ApiClientErrorData;
  errorType: string;

  constructor(message: string, status: number, data: ApiClientErrorData) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
    this.errorType = data.error_type || 'UnknownError';
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}
