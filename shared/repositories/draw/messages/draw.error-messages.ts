/**
 * Mensajes de error específicos para operaciones de draws.
 * Mensajes en español para mostrar al usuario.
 */

import { DrawErrorCode, DrawErrorDetails } from '../types/draw-error.types';

/**
 * Mensajes por defecto para cada código de error.
 * El backend puede enviar mensajes personalizados que se usan como fallback.
 */
export const DRAW_ERROR_MESSAGES: Record<DrawErrorCode, string> = {
  DRAW_NOT_FOUND: 'Este sorteo no existe o fue eliminado.',
  STRUCTURE_NOT_FOUND: 'La estructura no existe o fue eliminada.',
  DRAW_ALREADY_CLOSED: 'Este sorteo ya está cerrado y no acepta más apuestas.',
  DRAW_NOT_OPEN: 'Este sorteo aún no está abierto para realizar apuestas.',
  DRAW_NOT_ACTIVE: 'Este sorteo no está activo actualmente.',
  INVALID_NUMBERS: 'Los números seleccionados son inválidos para este tipo de apuesta.',
  INVALID_NUMBERS_COUNT: 'La cantidad de números no es válida para este sorteo.',
  BET_LIMIT_EXCEEDED: 'Has alcanzado el límite máximo de apuestas permitidas para este sorteo.',
  BET_AMOUNT_INVALID: 'El monto de la apuesta no es válido.',
  BET_AMOUNT_TOO_LOW: 'El monto de la apuesta es menor al mínimo permitido.',
  BET_AMOUNT_TOO_HIGH: 'El monto de la apuesta excede el máximo permitido.',
  UNAUTHORIZED: 'No tienes permiso para realizar esta acción.',
  USER_NO_STRUCTURE: 'Tu usuario no tiene una estructura asignada. Contacta a tu supervisor.',
  VALIDATION_ERROR: 'Error de validación en los datos proporcionados.',
  SERVER_ERROR: 'Error interno del servidor. Por favor, intenta más tarde.',
  RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes. Por favor, espera un momento.',
  BET_NO_STRUCTURE: 'No tienes una estructura asignada para realizar apuestas.',
  REWARDS_NOT_FOUND: 'No se encontraron premios para el tipo de apuesta.',
  BET_TYPE_NOT_FOUND: 'El tipo de apuesta no fue encontrado.',
};

/**
 * Mensajes amigables para el usuario basados en el contexto.
 */
export const getDrawErrorMessage = (
  code: DrawErrorCode,
  backendMessage?: string,
  details?: DrawErrorDetails | null
): string => {
  // Si el backend envió un mensaje personalizado, lo usamos
  if (backendMessage) {
    return backendMessage;
  }

  // Mensajes con contexto adicional
  switch (code) {
    case 'DRAW_NOT_FOUND':
      if (details?.draw_id) {
        return `El sorteo #${details.draw_id} no fue encontrado.`;
      }
      return DRAW_ERROR_MESSAGES[code];

    case 'DRAW_ALREADY_CLOSED':
      if (details?.draw_id) {
        return `El sorteo #${details.draw_id} ya está cerrado y no acepta más apuestas.`;
      }
      return DRAW_ERROR_MESSAGES[code];

    case 'DRAW_NOT_OPEN':
      return DRAW_ERROR_MESSAGES[code];

    case 'INVALID_NUMBERS_COUNT':
      if (details?.expected && details?.received) {
        return `Este sorteo requiere ${details.expected} número${details.expected > 1 ? 's' : ''}, pero selecionaste ${details.received}.`;
      }
      return DRAW_ERROR_MESSAGES[code];

    case 'BET_LIMIT_EXCEEDED':
      if (details?.limit) {
        return `Has alcanzado el límite de ${details.limit} apuestas permitidas para este sorteo.`;
      }
      return DRAW_ERROR_MESSAGES[code];

    case 'BET_AMOUNT_TOO_LOW':
      if (details?.min_amount) {
        return `El monto mínimo de apuesta es ${details.min_amount}.`;
      }
      return DRAW_ERROR_MESSAGES[code];

    case 'BET_AMOUNT_TOO_HIGH':
      if (details?.max_amount) {
        return `El monto máximo de apuesta es ${details.max_amount}.`;
      }
      return DRAW_ERROR_MESSAGES[code];

    case 'RATE_LIMIT_EXCEEDED':
      if (details?.retry_after) {
        return `Demasiadas solicitudes. Por favor, espera ${details.retry_after} segundos.`;
      }
      return DRAW_ERROR_MESSAGES[code];

    default:
      return DRAW_ERROR_MESSAGES[code] || 'Ocurrió un error inesperado.';
  }
};

/**
 * Sugerencias para el usuario basadas en el código de error.
 */
export const DRAW_ERROR_SUGGESTIONS: Partial<Record<DrawErrorCode, string>> = {
  DRAW_NOT_FOUND: 'Verifica el número del sorteo o contacta a soporte.',
  DRAW_ALREADY_CLOSED: 'Espera al próximo sorteo o selecciona otro que esté abierto.',
  DRAW_NOT_OPEN: 'Verifica el horario de apuestas del sorteo.',
  INVALID_NUMBERS: 'Revisa los números seleccionados y el tipo de apuesta.',
  INVALID_NUMBERS_COUNT: 'Ajusta la cantidad de números según las reglas del sorteo.',
  BET_LIMIT_EXCEEDED: 'Finaliza algunas apuestas existentes o contacta a tu supervisor.',
  BET_AMOUNT_TOO_LOW: 'Aumenta el monto de tu apuesta al mínimo requerido.',
  BET_AMOUNT_TOO_HIGH: 'Reduce el monto de tu apuesta al máximo permitido.',
  USER_NO_STRUCTURE: 'Contacta a tu supervisor para que te asigne una estructura.',
  SERVER_ERROR: 'Intenta de nuevo en unos minutos. Si el problema persiste, contacta a soporte.',
  RATE_LIMIT_EXCEEDED: 'Espera un momento antes de intentar de nuevo.',
  REWARDS_NOT_FOUND: 'Verifica la configuración de premios para este tipo de apuesta.',
  BET_TYPE_NOT_FOUND: 'Contacta a soporte para verificar los tipos de apuesta disponibles.',
};

/**
 * Obtiene la sugerencia para un código de error específico.
 */
export const getDrawErrorSuggestion = (code: DrawErrorCode): string | null => {
  return DRAW_ERROR_SUGGESTIONS[code] || null;
};
