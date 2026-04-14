import { drawRepository } from '@/shared/repositories/draw';
import { ExtendedDrawType } from '@/shared/services/draw/types';
import { Result } from 'neverthrow';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('WinningService');

export const WinningService = {
  async getDrawsWithWinners(): Promise<Result<ExtendedDrawType[], Error>> {
    log.debug('Fetching draws with winners');
    const result = await drawRepository.getDraws({ owner_structure: undefined });
    
    return result.map(draws => draws.filter(d => d.status === 'closed' && d.winning_numbers));
  },
};
