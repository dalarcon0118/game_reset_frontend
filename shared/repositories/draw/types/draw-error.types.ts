/**
 * Tipos de error específicos para operaciones de draws.
 * Estos códigos corresponden a los errores definidos en backend/draw/errors.py
 */

export type DrawErrorCode =
  | 'DRAW_NOT_FOUND'
  | 'STRUCTURE_NOT_FOUND'
  | 'DRAW_ALREADY_CLOSED'
  | 'DRAW_NOT_OPEN'
  | 'DRAW_NOT_ACTIVE'
  | 'INVALID_NUMBERS'
  | 'INVALID_NUMBERS_COUNT'
  | 'BET_LIMIT_EXCEEDED'
  | 'BET_AMOUNT_INVALID'
  | 'BET_AMOUNT_TOO_LOW'
  | 'BET_AMOUNT_TOO_HIGH'
  | 'UNAUTHORIZED'
  | 'USER_NO_STRUCTURE'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'BET_NO_STRUCTURE'
  | 'REWARDS_NOT_FOUND'
  | 'BET_TYPE_NOT_FOUND';

export interface DrawErrorDetails {
  draw_id?: number;
  structure_id?: number;
  field?: string;
  detail?: string;
  expected?: number;
  received?: number;
  limit?: number;
  current?: number;
  min_amount?: number;
  max_amount?: number;
  retry_after?: number;
}

export interface DrawErrorResponse {
  success: false;
  error: {
    code: DrawErrorCode;
    message: string;
    details: DrawErrorDetails | null;
  };
}

/**
 * Códigos de error que indican que el usuario debe tomar acción
 * (ej: contactar soporte, esperar, etc.)
 */
export const ACTIONABLE_ERROR_CODES: DrawErrorCode[] = [
  'RATE_LIMIT_EXCEEDED',
  'SERVER_ERROR',
];

/**
 * Códigos de error que el usuario puede resolver por sí mismo
 * (ej: corregir números, esperar a que abra el sorteo, etc.)
 */
export const USER_RESOLVABLE_ERROR_CODES: DrawErrorCode[] = [
  'DRAW_NOT_FOUND',
  'DRAW_ALREADY_CLOSED',
  'DRAW_NOT_OPEN',
  'DRAW_NOT_ACTIVE',
  'INVALID_NUMBERS',
  'INVALID_NUMBERS_COUNT',
  'BET_LIMIT_EXCEEDED',
  'BET_AMOUNT_TOO_LOW',
  'BET_AMOUNT_TOO_HIGH',
];
