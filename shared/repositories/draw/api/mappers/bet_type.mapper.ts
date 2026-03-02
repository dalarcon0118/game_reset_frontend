import { GameType } from '@/types';
import { BetType } from '@/shared/services/draw/types';
import logger from '@/shared/utils/logger';

const log = logger.withTag('[BetTypeMapper]');

// Normalizamos los códigos para asegurar que coincidan con GameType
const normalizeCode = (code?: string, name?: string): string => {
  const input = code || name || '';
  return input.toUpperCase();
};

export const mapBetTypeToGameType = (betType: BetType): GameType => {
  log.debug('mapBetTypeToGameType', betType);
  return {
    id: betType.id.toString(),
    name: betType.name,
    code: normalizeCode(betType.code, betType.name),
    description: betType.description || betType.name
  };
};

export const mapBetTypesToGameTypes = (betTypes: BetType[]): GameType[] =>
  betTypes.map(mapBetTypeToGameType);