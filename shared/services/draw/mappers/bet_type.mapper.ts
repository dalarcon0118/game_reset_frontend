import { GameType } from '@/types';
import { BetType } from '@/shared/services/draw/types';

// Normalizamos los códigos para asegurar que coincidan con GameType
const normalizeCode = (code?: string, name?: string): GameType['code'] => {
  const input = code || name || '';
  const upperInput = input.toUpperCase();

  if (upperInput.includes('FIJO')) return 'FIJO';
  if (upperInput.includes('PARLET')) return 'PARLET';
  if (upperInput.includes('CORRIDO')) return 'CORRIDO';
  if (upperInput.includes('CENTENA')) return 'CENTENA';
  if (upperInput.includes('QUINIELA') || upperInput.includes('DIRECTA')) return 'QUINIELA_DIRECTA';

  // Fallback seguro
  return 'FIJO';
};

export const mapBetTypeToGameType = (betType: BetType): GameType => {
  return {
    id: betType.id.toString(),
    name: betType.name,
    code: normalizeCode(betType.code, betType.name),
    description: betType.description || betType.name
  };
};

export const mapBetTypesToGameTypes = (betTypes: BetType[]): GameType[] =>
  betTypes.map(mapBetTypeToGameType);