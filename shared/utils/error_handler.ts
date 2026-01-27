import { ApiErrorType, ApiErrorResponse } from '../../types/api';

/**
 * Utility to classify errors from the API or network
 */
export class ErrorHandler {
  static classify(error: any): ApiErrorResponse {
    // If it's already a structured error from our backend
    if (error && error.error_type) {
      return error as ApiErrorResponse;
    }

    // Handle AbortSignal cancellation
    if (error && error.name === 'AbortError') {
      return {
        error_type: 'AbortError',
        message: 'Request was cancelled',
        status_code: 499
      };
    }

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message === 'Network request failed') {
      return {
        error_type: 'NetworkError',
        message: 'No internet connection or server unreachable',
        status_code: 0
      };
    }

    // Default error
    return {
      error_type: 'UnknownError',
      message: error?.message || 'An unexpected error occurred',
      status_code: 500
    };
  }

  static isRetryable(error: any): boolean {
    const classified = this.classify(error);
    const retryableTypes: ApiErrorType[] = ['NetworkError', 'ServerError'];
    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    return (
      retryableTypes.includes(classified.error_type) || 
      retryableStatuses.includes(classified.status_code)
    );
  }
}
