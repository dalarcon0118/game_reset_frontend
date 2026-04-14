import { ExtendedDrawType } from '@/shared/services/draw/types';

export const WinningAdapters = {
  normalizeDraws: (draws: ExtendedDrawType[]) => draws.map(draw => ({
    ...draw,
    winning_number: typeof draw.winning_numbers === 'string' 
      ? draw.winning_numbers 
      : draw.winning_numbers?.winning_number || 'N/A',
  })),
};
