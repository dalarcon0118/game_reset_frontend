export function validateParletNumbers(numbers: number[]): { ok: boolean; errorCode?: string } {
  if (!numbers || numbers.length < 2) return { ok: false, errorCode: 'PARLET_MIN_NUMBERS' };
  return { ok: true };
}

export function validateAmount(input: string): { ok: boolean; value?: number; errorCode?: string } {
  const value = parseInt(input, 10);
  if (isNaN(value)) return { ok: false, errorCode: 'INVALID_AMOUNT' };
  return { ok: true, value };
}