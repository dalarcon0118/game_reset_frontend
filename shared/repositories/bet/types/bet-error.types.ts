/**
 * Tipos de error específicos para operaciones de bets.
 * Estos códigos corresponden a los errores definidos en backend/bet/errors.py
 */

export type BetErrorCode =
  | 'BET_INVALID_PAYLOAD'
  | 'BET_DRAW_NOT_FOUND'
  | 'BET_NO_STRUCTURE'
  | 'BET_NO_PERMISSION'
  | 'BET_INVALID_FINGERPRINT'
  | 'BET_OUTSIDE_TIME_WINDOW'
  | 'BET_DUPLICATE_NONCE'
  | 'BET_VALIDATION_FAILED'
  | 'BET_INTERNAL_ERROR'
  | 'BET_RECEIPT_NOT_FOUND'
  | 'BET_NO_BETS_FOR_RECEIPT'
  | 'BET_NUMBERS_REQUIRED'
  | 'BET_AMOUNT_EXCEEDS_LIMIT'
  | 'BET_AMOUNT_TOO_LOW'
  | 'BET_AMOUNT_TOO_HIGH'
  | 'BET_INVALID_NUMBERS'
  | 'BET_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR';

export interface BetErrorDetails {
  draw_id?: number;
  receipt_code?: string;
  structure_id?: number;
  reason?: string;
  limit?: number;
  current?: number;
  min_amount?: number;
  max_amount?: number;
  expected?: number;
  received?: number;
  errors?: Record<string, string[]>;
  pydantic_error?: string;
  retry_after?: number;
  nonce?: string;
  detail?: string;
}

export interface BetErrorResponse {
  success: false;
  error: {
    code: BetErrorCode;
    message: string;
    details: BetErrorDetails | null;
  };
}

/**
 * Códigos de error que indican que el usuario debe esperar o contactar soporte.
 */
export const ACTIONABLE_ERROR_CODES: BetErrorCode[] = [
  'RATE_LIMIT_EXCEEDED',
  'SERVER_ERROR',
  'BET_INTERNAL_ERROR',
  'BET_INVALID_FINGERPRINT',
];

/**
 * Códigos de error que el usuario puede resolver por sí mismo.
 */
export const USER_RESOLVABLE_ERROR_CODES: BetErrorCode[] = [
  'BET_DRAW_NOT_FOUND',
  'BET_NO_STRUCTURE',
  'BET_OUTSIDE_TIME_WINDOW',
  'BET_NUMBERS_REQUIRED',
  'BET_AMOUNT_TOO_LOW',
  'BET_AMOUNT_TOO_HIGH',
  'BET_INVALID_NUMBERS',
  'BET_LIMIT_EXCEEDED',
  'BET_AMOUNT_EXCEEDS_LIMIT',
];
