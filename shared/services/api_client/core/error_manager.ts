import { ApiClientError, ApiClientErrorData } from '../api_client.errors';
import { ILogger, RequestOptions } from '../api_client.types';
import { isServerSpecificErrorMessage } from '../../../utils/server_error_patterns';

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
  503: 'Base de datos temporalmente no disponible. Por favor, intenta más tarde.',
  504: 'Tiempo de espera agotado. Por favor, intenta nuevamente.',
};

export class ErrorManager {
  private consecutiveFailures = 0;
  private readonly FAILURE_THRESHOLD = 3;

  constructor(private log: ILogger) { }

  /**
   * Traduce un código de error HTTP a un mensaje user-friendly
   * Preserva mensajes específicos del servidor para ciertos tipos de errores
   */
  public translateError(status: number, technicalMessage?: string, errorData?: ApiClientErrorData): string {
    // PRIORIDAD 1: Si hay un mensaje específico del servidor, usarlo siempre
    // Esto es crucial para errores como OperationalError que contienen mensajes detallados
    if (technicalMessage && this.shouldPreserveServerMessage(technicalMessage, errorData)) {
      return technicalMessage;
    }

    // PRIORIDAD 2: Para errores de servidor (500-599), verificar si hay detail específico del backend
    if ((status >= 500 && status < 600) && errorData?.detail) {
      return errorData.detail;
    }

    // PRIORIDAD 3: Para errores 401 (Unauthorized), verificar mensaje específico del backend
    // El backend puede devolver mensajes específicos para credenciales inválidas, sesión expirada, etc.
    if (status === 401) {
      if (errorData?.detail) {
        return errorData.detail;
      }
      // Verificar si hay código de error específico del backend
      const backendCode = errorData?.code || errorData?.error_type;
      if (backendCode === 'INVALID_CREDENTIALS' || backendCode === 'INVALID_PIN') {
        return 'El PIN ingresado es incorrecto.';
      }
      if (backendCode === 'USER_NOT_FOUND') {
        return 'El usuario no existe. Verifica el nombre de usuario.';
      }
      if (backendCode === 'SESSION_EXPIRED') {
        return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      }
    }

    // PRIORIDAD 4: Para errores 403 (Forbidden), verificar mensaje específico del backend
    if (status === 403) {
      if (errorData?.detail) {
        return errorData.detail;
      }
      // Verificar si hay código de error específico del backend
      const backendCode = errorData?.code || errorData?.error_type;
      if (backendCode === 'DEVICE_LOCKED') {
        return 'Este dispositivo ya no está autorizado. Contacta al administrador.';
      }
      if (backendCode === 'ACCOUNT_DISABLED') {
        return 'Tu cuenta está desactivada. Contacta al administrador.';
      }
    }

    // PRIORIDAD 5: Verificar si hay una traducción específica para el código
    const translatedMessage = ERROR_TRANSLATION_MAP[status];
    if (translatedMessage) {
      return translatedMessage;
    }

    // PRIORIDAD 6: Para códigos no mapeados, usar categorías generales
    if (status >= 400 && status < 500) {
      return 'Error en la solicitud. Por favor, verifica los datos e intenta nuevamente.';
    } else if (status >= 500) {
      return 'Error del servidor. Por favor, intenta más tarde.';
    }

    // Fallback a mensaje técnico si no hay traducción
    return technicalMessage || 'Ocurrió un error inesperado.';
  }

  /**
   * Determina si un mensaje del servidor debe preservarse en lugar de traducirlo
   */
  private shouldPreserveServerMessage(technicalMessage: string, errorData?: ApiClientErrorData): boolean {
    return isServerSpecificErrorMessage(technicalMessage);
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

      // Procesar el patrón de respuesta del backend { success: false, error: { code, message } }
      if ((errorData as any).error && typeof (errorData as any).error === 'object') {
        const backendError = (errorData as any).error;
        errorData = {
          ...errorData,
          // Preservar el código del backend para mapeo posterior
          code: backendError.code || errorData.code,
          error_type: backendError.code || errorData.error_type,
          // Preservar el mensaje del backend
          message: backendError.message || backendError.code || errorData.message || errorData.detail,
          // Preservar detalles adicionales
          detail: backendError.message || errorData.detail,
        };
      } else if ((errorData as any).error && typeof (errorData as any).error === 'string') {
        errorData = {
          ...errorData,
          message: (errorData as any).error
        };
      }
      
      // Para errores del backend que usan el patrón { detail, error_code, ... }
      // Preservar el mensaje específico del servidor
      if (errorData.detail && !errorData.message) {
        errorData.message = errorData.detail;
      }
    } catch {
      errorData = { message: response.statusText || `Error ${response.status}` };
      this.log.error(`<<< API ERROR (Could not parse body): ${response.status}`, {
        endpoint,
        status: response.status,
      });
    }

    const userFriendlyMessage = this.translateError(response.status, errorData.message, errorData);
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
