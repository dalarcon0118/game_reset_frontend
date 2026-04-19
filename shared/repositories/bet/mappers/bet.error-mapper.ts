/**
 * Mapper para errores de bets.
 * Transforma errores del backend al formato esperado por el frontend.
 */

import { BetErrorCode, BetErrorResponse, BetErrorDetails } from '../types/bet-error.types';
import { getBetErrorMessage, getBetErrorSuggestion } from '../messages/bet.error-messages';

/**
 * Error estructurado para bets que puede ser usado en la UI.
 */
export interface StructuredBetError {
  code: BetErrorCode;
  message: string;
  suggestion: string | null;
  details: BetErrorDetails | null;
  isRetryable: boolean;
  isUserResolvable: boolean;
}

/**
 * Códigos de error que indican que se puede reintentar la operación.
 */
const RETRYABLE_ERROR_CODES: BetErrorCode[] = [
  'SERVER_ERROR',
  'RATE_LIMIT_EXCEEDED',
  'BET_INTERNAL_ERROR',
];

/**
 * Códigos de error que el usuario puede resolver por sí mismo.
 */
const USER_RESOLVABLE_ERROR_CODES: BetErrorCode[] = [
  'BET_DRAW_NOT_FOUND',
  'BET_OUTSIDE_TIME_WINDOW',
  'BET_NUMBERS_REQUIRED',
  'BET_AMOUNT_TOO_LOW',
  'BET_AMOUNT_TOO_HIGH',
  'BET_INVALID_NUMBERS',
  'BET_LIMIT_EXCEEDED',
  'BET_AMOUNT_EXCEEDS_LIMIT',
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
export const extractBetErrorFromResponse = (error: unknown): BetErrorResponse | null => {
  // Si ya es un BetErrorResponse, lo usamos directamente
  if (
    error &&
    typeof error === 'object' &&
    'success' in error &&
    (error as any).success === false &&
    'error' in error
  ) {
    return error as BetErrorResponse;
  }

  // Si es un error de API (ApiClientError), intentamos extraer la respuesta
  if (isApiClientError(error) && error.response?.data) {
    const data = error.response.data;

    // Verificar si ya tiene el formato de error estructurado
    if (data.success === false && data.error) {
      return data as BetErrorResponse;
    }
  }

  return null;
};

/**
 * Verifica si un código de error es un código válido de BetError.
 */
export const isValidBetErrorCode = (code: string): code is BetErrorCode => {
  const validCodes: BetErrorCode[] = [
    'BET_INVALID_PAYLOAD',
    'BET_DRAW_NOT_FOUND',
    'BET_NO_STRUCTURE',
    'BET_NO_PERMISSION',
    'BET_INVALID_FINGERPRINT',
    'BET_OUTSIDE_TIME_WINDOW',
    'BET_DUPLICATE_NONCE',
    'BET_VALIDATION_FAILED',
    'BET_INTERNAL_ERROR',
    'BET_RECEIPT_NOT_FOUND',
    'BET_NO_BETS_FOR_RECEIPT',
    'BET_NUMBERS_REQUIRED',
    'BET_AMOUNT_EXCEEDS_LIMIT',
    'BET_AMOUNT_TOO_LOW',
    'BET_AMOUNT_TOO_HIGH',
    'BET_INVALID_NUMBERS',
    'BET_LIMIT_EXCEEDED',
    'UNAUTHORIZED',
    'RATE_LIMIT_EXCEEDED',
    'SERVER_ERROR',
  ];
  return validCodes.includes(code as BetErrorCode);
};

/**
 * Mapea un error de API a un StructuredBetError.
 * Soporta errores del apiClient del proyecto (no usa Axios).
 */
export const mapApiErrorToBetError = (error: unknown): StructuredBetError => {
  // Intentar extraer el error estructurado del backend
  const betErrorResponse = extractBetErrorFromResponse(error);

  if (betErrorResponse) {
    const { code, message, details } = betErrorResponse.error;
    return {
      code,
      message: getBetErrorMessage(code, message, details),
      suggestion: getBetErrorSuggestion(code),
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
          code: 'BET_NO_PERMISSION',
          message: 'No tienes permiso para realizar esta acción.',
          suggestion: 'Contacta a tu supervisor si crees que deberías tener acceso.',
          details: null,
          isRetryable: false,
          isUserResolvable: false,
        };
      case 404:
        return {
          code: 'BET_RECEIPT_NOT_FOUND',
          message: 'El recurso solicitado no fue encontrado.',
          suggestion: 'Verifica que el recibo o sorteo aún exista.',
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
 * @deprecated Usar mapApiErrorToBetError en su lugar.
 * Mantiene compatibilidad con código existente que pueda usar este nombre.
 */
export const mapAxiosErrorToBetError = mapApiErrorToBetError;

/**
 * Crea un error estructurado de bet a partir de un código y detalles.
 */
export const createBetError = (
  code: BetErrorCode,
  details?: BetErrorDetails | null
): StructuredBetError => {
  return {
    code,
    message: getBetErrorMessage(code, undefined, details),
    suggestion: getBetErrorSuggestion(code),
    details: details || null,
    isRetryable: RETRYABLE_ERROR_CODES.includes(code),
    isUserResolvable: USER_RESOLVABLE_ERROR_CODES.includes(code),
  };
};