import { ApiClientError, ApiClientErrorData } from '../api_client.errors';
import { ILogger, RequestOptions } from '../api_client.types';

// Mapa de traducción de errores HTTP a mensajes user-friendly
const ERROR_TRANSLATION_MAP: Record<number, string> = {
  400: 'Solicitud inválida. Por favor, verifica los datos ingresados.',
  401: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  408: 'Tiempo de espera agotado. Por favor, intenta nuevamente.',
  429: 'Demasiadas solicitudes. Por favor, espera un momento.',
  500: 'Error interno del servidor. Por favor, intenta más tarde.',
  502: 'Servicio no disponible. Por favor, intenta más tarde.',
  503: 'Servicio en mantenimiento. Por favor, intenta más tarde.',
  504: 'Tiempo de espera agotado. Por favor, intenta nuevamente.',
};

export class ErrorManager {
  private consecutiveFailures = 0;
  private readonly FAILURE_THRESHOLD = 3;

  constructor(private log: ILogger) { }

  /**
   * Traduce un código de error HTTP a un mensaje user-friendly
   */
  public translateError(status: number, technicalMessage?: string): string {
    // Verificar si hay una traducción específica para el código
    const translatedMessage = ERROR_TRANSLATION_MAP[status];
    if (translatedMessage) {
      return translatedMessage;
    }

    // Para códigos no mapeados, usar categorías generales
    if (status >= 400 && status < 500) {
      return 'Error en la solicitud. Por favor, verifica los datos e intenta nuevamente.';
    } else if (status >= 500) {
      return 'Error del servidor. Por favor, intenta más tarde.';
    }

    // Fallback a mensaje técnico si no hay traducción
    return technicalMessage || 'Ocurrió un error inesperado.';
  }

  async handleResponseError(
    response: Response,
    endpoint: string,
    options: RequestOptions
  ): Promise<ApiClientError> {
    if (!options.silentErrors) {
      this.log.error(`API Error Response: ${response.status}`, {
        endpoint,
        status: response.status,
        statusText: response.statusText,
      });
    }

    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      this.log.error(
        `CRITICAL: Multiple consecutive API failures (${this.consecutiveFailures})`,
        {
          endpoint,
          status: response.status,
          threshold: this.FAILURE_THRESHOLD,
        }
      );
    }

    let errorData: ApiClientErrorData = {};
    try {
      errorData = await response.json();
      this.log.error(`<<< API ERROR RESPONSE: ${response.status}`, {
        endpoint,
        status: response.status,
        data: errorData,
      });
    } catch {
      errorData = { message: response.statusText || `Error ${response.status}` };
      this.log.error(`<<< API ERROR (Could not parse body): ${response.status}`, {
        endpoint,
        status: response.status,
      });
    }

    const userFriendlyMessage = this.translateError(response.status, errorData.message);
    const error = new ApiClientError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData,
      userFriendlyMessage
    );

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) error.data.retry_after = parseInt(retryAfter, 10);
    }

    return error;
  }

  handleNetworkError(
    error: any,
    endpoint: string,
    attempt: number,
    retryCount: number,
    options: RequestOptions,
    abortSignal?: AbortSignal
  ): ApiClientError | 'RETRY' {
    if (!options.silentErrors) {
      this.log.error(`Network or Request Error: ${endpoint}`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        error,
      });
    }

    if (error instanceof ApiClientError) return error;

    if (error instanceof Error && error.name === 'AbortError') {
      if (abortSignal?.aborted) {
        this.log.debug('Request aborted by user', { endpoint });
        return new ApiClientError('Request aborted', 0, { message: 'Aborted' });
      }
      this.log.warn(`Request timed out (attempt ${attempt})`, { endpoint });
      if (attempt < retryCount) return 'RETRY';
    }

    if (attempt < retryCount) return 'RETRY';

    return new ApiClientError(
      error instanceof Error ? error.message : 'Network error',
      0,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    );
  }

  resetConsecutiveFailures() {
    this.consecutiveFailures = 0;
  }
}
