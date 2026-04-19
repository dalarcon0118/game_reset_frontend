/**
 * Mensajes de error específicos para operaciones de bets.
 * Mensajes en español para mostrar al usuario.
 */

import { BetErrorCode, BetErrorDetails } from '../types/bet-error.types';

/**
 * Mensajes por defecto para cada código de error.
 * El backend puede enviar mensajes personalizados que se usan como fallback.
 */
export const BET_ERROR_MESSAGES: Record<BetErrorCode, string> = {
  BET_INVALID_PAYLOAD: 'El formato de los datos de la apuesta es inválido.',
  BET_DRAW_NOT_FOUND: 'El sorteo seleccionado no fue encontrado.',
  BET_NO_STRUCTURE: 'No tienes una estructura activa asignada para apostar.',
  BET_NO_PERMISSION: 'No tienes permiso para apostar en esta estructura.',
  BET_INVALID_FINGERPRINT: 'La verificación de seguridad falló. Reinicia la app.',
  BET_OUTSIDE_TIME_WINDOW: 'La apuesta está fuera del horario permitido para este sorteo.',
  BET_DUPLICATE_NONCE: 'Esta apuesta ya fue procesada. No se permiten duplicados.',
  BET_VALIDATION_FAILED: 'Error de validación en los datos de la apuesta.',
  BET_INTERNAL_ERROR: 'Error interno al procesar la apuesta. Intenta más tarde.',
  BET_RECEIPT_NOT_FOUND: 'El recibo no fue encontrado.',
  BET_NO_BETS_FOR_RECEIPT: 'No se encontraron apuestas para este recibo.',
  BET_NUMBERS_REQUIRED: 'Debes seleccionar al menos un número para apostar.',
  BET_AMOUNT_EXCEEDS_LIMIT: 'El monto de la apuesta excede el límite permitido.',
  BET_AMOUNT_TOO_LOW: 'El monto de la apuesta es menor al mínimo permitido.',
  BET_AMOUNT_TOO_HIGH: 'El monto de la apuesta excede el máximo permitido.',
  BET_INVALID_NUMBERS: 'Los números seleccionados son inválidos para este tipo de apuesta.',
  BET_LIMIT_EXCEEDED: 'Has alcanzado el límite máximo de apuestas permitidas.',
  UNAUTHORIZED: 'Debes iniciar sesión para realizar esta acción.',
  RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes. Por favor, espera un momento.',
  SERVER_ERROR: 'Error interno del servidor. Por favor, intenta más tarde.',
};

/**
 * Mensajes amigables para el usuario basados en el contexto.
 */
export const getBetErrorMessage = (
  code: BetErrorCode,
  backendMessage?: string,
  details?: BetErrorDetails | null
): string => {
  // Si el backend envió un mensaje personalizado, lo usamos
  if (backendMessage) {
    return backendMessage;
  }

  // Mensajes con contexto adicional
  switch (code) {
    case 'BET_DRAW_NOT_FOUND':
      if (details?.draw_id) {
        return `El sorteo #${details.draw_id} no fue encontrado.`;
      }
      return BET_ERROR_MESSAGES[code];

    case 'BET_OUTSIDE_TIME_WINDOW':
      return BET_ERROR_MESSAGES[code];

    case 'BET_INVALID_NUMBERS':
      if (details?.expected && details?.received) {
        return `Este tipo de apuesta requiere ${details.expected} número${details.expected > 1 ? 's' : ''}, pero seleccionaste ${details.received}.`;
      }
      return BET_ERROR_MESSAGES[code];

    case 'BET_AMOUNT_TOO_LOW':
      if (details?.min_amount) {
        return `El monto mínimo de apuesta es ${details.min_amount}.`;
      }
      return BET_ERROR_MESSAGES[code];

    case 'BET_AMOUNT_TOO_HIGH':
      if (details?.max_amount) {
        return `El monto máximo de apuesta es ${details.max_amount}.`;
      }
      return BET_ERROR_MESSAGES[code];

    case 'BET_AMOUNT_EXCEEDS_LIMIT':
      if (details?.limit) {
        return `El monto excede el límite permitido de ${details.limit}.`;
      }
      return BET_ERROR_MESSAGES[code];

    case 'BET_LIMIT_EXCEEDED':
      if (details?.limit) {
        return `Has alcanzado el límite de ${details.limit} apuestas permitidas.`;
      }
      return BET_ERROR_MESSAGES[code];

    case 'BET_INVALID_FINGERPRINT':
      if (details?.reason) {
        return `Verificación de seguridad fallida: ${details.reason}`;
      }
      return BET_ERROR_MESSAGES[code];

    case 'RATE_LIMIT_EXCEEDED':
      if (details?.retry_after) {
        return `Demasiadas solicitudes. Por favor, espera ${details.retry_after} segundos.`;
      }
      return BET_ERROR_MESSAGES[code];

    default:
      return BET_ERROR_MESSAGES[code] || 'Ocurrió un error inesperado.';
  }
};

/**
 * Sugerencias para el usuario basadas en el código de error.
 */
export const BET_ERROR_SUGGESTIONS: Partial<Record<BetErrorCode, string>> = {
  BET_INVALID_PAYLOAD: 'Cierra y vuelve a abrir la aplicación.',
  BET_DRAW_NOT_FOUND: 'Verifica que el sorteo aún exista o selecciona otro.',
  BET_NO_STRUCTURE: 'Contacta a tu supervisor para que te asigne una estructura.',
  BET_OUTSIDE_TIME_WINDOW: 'Verifica el horario de apuestas del sorteo.',
  BET_INVALID_FINGERPRINT: 'Reinicia la aplicación e intenta de nuevo.',
  BET_DUPLICATE_NONCE: 'Esta apuesta ya fue procesada. Contacta a soporte si crees que es un error.',
  BET_VALIDATION_FAILED: 'Revisa los datos de tu apuesta.',
  BET_INTERNAL_ERROR: 'Intenta de nuevo en unos minutos.',
  BET_NUMBERS_REQUIRED: 'Selecciona los números para tu apuesta.',
  BET_AMOUNT_TOO_LOW: 'Aumenta el monto al mínimo requerido.',
  BET_AMOUNT_TOO_HIGH: 'Reduce el monto al máximo permitido.',
  BET_AMOUNT_EXCEEDS_LIMIT: 'Contacta a tu supervisor para aumentar tu límite.',
  BET_INVALID_NUMBERS: 'Revisa los números seleccionados según el tipo de apuesta.',
  BET_LIMIT_EXCEEDED: 'Finaliza algunas apuestas existentes o contacta a tu supervisor.',
  RATE_LIMIT_EXCEEDED: 'Espera un momento antes de intentar de nuevo.',
  SERVER_ERROR: 'Intenta de nuevo en unos minutos. Si el problema persiste, contacta a soporte.',
};

/**
 * Obtiene la sugerencia para un código de error específico.
 */
export const getBetErrorSuggestion = (code: BetErrorCode): string | null => {
  return BET_ERROR_SUGGESTIONS[code] || null;
};
