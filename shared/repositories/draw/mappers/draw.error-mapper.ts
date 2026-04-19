/**
 * Mapper para errores de draws.
 * Transforma errores del backend al formato esperado por el frontend.
 */

import { DrawErrorCode, DrawErrorResponse, DrawErrorDetails } from '../types/draw-error.types';
import { getDrawErrorMessage, getDrawErrorSuggestion } from '../messages/draw.error-messages';

/**
 * Error estructurado para draws que puede ser usado en la UI.
 */
export interface StructuredDrawError {
  code: DrawErrorCode;
  message: string;
  suggestion: string | null;
  details: DrawErrorDetails | null;
  isRetryable: boolean;
  isUserResolvable: boolean;
}

/**
 * Códigos de error que indican que se puede reintentar la operación.
 */
const RETRYABLE_ERROR_CODES: DrawErrorCode[] = [
  'SERVER_ERROR',
  'RATE_LIMIT_EXCEEDED',
];

/**
 * Códigos de error que el usuario puede resolver por sí mismo.
 */
const USER_RESOLVABLE_ERROR_CODES: DrawErrorCode[] = [
  'DRAW_NOT_FOUND',
  'DRAW_ALREADY_CLOSED',
  'DRAW_NOT_OPEN',
  'DRAW_NOT_ACTIVE',
  'INVALID_NUMBERS',
  'INVALID_NUMBERS_COUNT',
  'BET_LIMIT_EXCEEDED',
  'BET_AMOUNT_TOO_LOW',
  'BET_AMOUNT_TOO_HIGH',
  'REWARDS_NOT_FOUND',
  'BET_TYPE_NOT_FOUND',
];

/**
 * Tipo para detectar errores de API del proyecto (no usa Axios).
 * El apiClient del proyecto tiene una estructura de error diferente.
 */
interface ApiClientError {
  response?: {
    data?: {
      success?: boolean;
      error?: { code: string; message: string; details?: any };
    };
    status?: number;
  };
  message?: string;
}

/**
 * Verifica si un error tiene la estructura de un ApiClientError.
 */
const isApiClientError = (error: unknown): error is ApiClientError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  );
};

/**
 * Intenta extraer el código de error de una respuesta de error de API.
 */
export const extractDrawErrorFromResponse = (error: unknown): DrawErrorResponse | null => {
  // Si ya es un DrawErrorResponse, lo usamos directamente
  if (
    error &&
    typeof error === 'object' &&
    'success' in error &&
    (error as any).success === false &&
    'error' in error
  ) {
    return error as DrawErrorResponse;
  }

  // Si es un error de API (ApiClientError), intentamos extraer la respuesta
  if (isApiClientError(error) && error.response?.data) {
    const data = error.response.data;

    // Verificar si ya tiene el formato de error estructurado
    if (data.success === false && data.error) {
      return data as DrawErrorResponse;
    }
  }

  return null;
};

/**
 * Verifica si un código de error es un código válido de DrawError.
 */
export const isValidDrawErrorCode = (code: string): code is DrawErrorCode => {
  const validCodes: DrawErrorCode[] = [
    'DRAW_NOT_FOUND',
    'STRUCTURE_NOT_FOUND',
    'DRAW_ALREADY_CLOSED',
    'DRAW_NOT_OPEN',
    'DRAW_NOT_ACTIVE',
    'INVALID_NUMBERS',
    'INVALID_NUMBERS_COUNT',
    'BET_LIMIT_EXCEEDED',
    'BET_AMOUNT_INVALID',
    'BET_AMOUNT_TOO_LOW',
    'BET_AMOUNT_TOO_HIGH',
    'UNAUTHORIZED',
    'USER_NO_STRUCTURE',
    'VALIDATION_ERROR',
    'SERVER_ERROR',
    'RATE_LIMIT_EXCEEDED',
    'BET_NO_STRUCTURE',
    'REWARDS_NOT_FOUND',
    'BET_TYPE_NOT_FOUND',
  ];
  return validCodes.includes(code as DrawErrorCode);
};

/**
 * Mapea un error de API a un StructuredDrawError.
 * Soporta errores del apiClient del proyecto (no usa Axios).
 */
export const mapApiErrorToDrawError = (error: unknown): StructuredDrawError => {
  // Intentar extraer el error estructurado del backend
  const drawErrorResponse = extractDrawErrorFromResponse(error);

  if (drawErrorResponse) {
    const { code, message, details } = drawErrorResponse.error;
    return {
      code,
      message: getDrawErrorMessage(code, message, details),
      suggestion: getDrawErrorSuggestion(code),
      details,
      isRetryable: RETRYABLE_ERROR_CODES.includes(code),
      isUserResolvable: USER_RESOLVABLE_ERROR_CODES.includes(code),
    };
  }

  // Manejar errores de red o errores sin formato específico usando ApiClientError
  if (isApiClientError(error)) {
    // Error de red (sin respuesta)
    if (!error.response) {
      return {
        code: 'SERVER_ERROR',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        suggestion: 'Verifica tu conexión a internet e intenta de nuevo.',
        details: null,
        isRetryable: true,
        isUserResolvable: false,
      };
    }

    // Manejar códigos de estado HTTP comunes
    const status = error.response.status;
    switch (status) {
      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
          suggestion: 'Cierra sesión y vuelve a iniciar.',
          details: null,
          isRetryable: false,
          isUserResolvable: false,
        };
      case 403:
        return {
          code: 'UNAUTHORIZED',
          message: 'No tienes permiso para realizar esta acción.',
          suggestion: 'Contacta a tu supervisor si crees que deberías tener acceso.',
          details: null,
          isRetryable: false,
          isUserResolvable: false,
        };
      case 404:
        return {
          code: 'DRAW_NOT_FOUND',
          message: 'El recurso solicitado no fue encontrado.',
          suggestion: 'Verifica que el sorteo aún exista.',
          details: null,
          isRetryable: false,
          isUserResolvable: true,
        };
      case 429:
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Demasiadas solicitudes. Por favor, espera un momento.',
          suggestion: 'Espera unos segundos antes de intentar de nuevo.',
          details: null,
          isRetryable: true,
          isUserResolvable: true,
        };
      case 500:
      default:
        return {
          code: 'SERVER_ERROR',
          message: 'Error interno del servidor. Por favor, intenta más tarde.',
          suggestion: 'Intenta de nuevo en unos minutos.',
          details: null,
          isRetryable: true,
          isUserResolvable: false,
        };
    }
  }

  // Error genérico
  return {
    code: 'SERVER_ERROR',
    message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
    suggestion: 'Si el problema persiste, contacta a soporte.',
    details: null,
    isRetryable: true,
    isUserResolvable: false,
  };
};

/**
 * @deprecated Usar mapApiErrorToDrawError en su lugar.
 * Mantiene compatibilidad con código existente que pueda usar este nombre.
 */
export const mapAxiosErrorToDrawError = mapApiErrorToDrawError;

/**
 * Crea un error estructurado de draw a partir de un código y detalles.
 */
export const createDrawError = (
  code: DrawErrorCode,
  details?: DrawErrorDetails | null
): StructuredDrawError => {
  return {
    code,
    message: getDrawErrorMessage(code, undefined, details),
    suggestion: getDrawErrorSuggestion(code),
    details: details || null,
    isRetryable: RETRYABLE_ERROR_CODES.includes(code),
    isUserResolvable: USER_RESOLVABLE_ERROR_CODES.includes(code),
  };
};
