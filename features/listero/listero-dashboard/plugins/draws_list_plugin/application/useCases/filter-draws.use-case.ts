import { StatusFilter, DRAW_FILTER, Draw } from '../../core/types';
import { TimerRepository } from '@/shared/repositories/system/time';
import { logger } from '@/shared/utils/logger';
import { drawRepository } from '@/shared/repositories/draw';

const log = logger.withTag('FILTER_DRAWS_USE_CASE');

export interface FilterDrawsInput {
  draws: Draw[];
  filter: StatusFilter;
  currentTime?: number;
}

export class FilterDrawsUseCase {
  execute(input: FilterDrawsInput): Draw[] {
    const { draws, filter, currentTime } = input;
    const now = currentTime ?? TimerRepository.getTrustedNow(Date.now());

    log.info(`Filtering draws with filter: ${filter}`, { 
      count: draws.length, 
      now: new Date(now).toLocaleString(),
      nowMs: now 
    });

    // ✅ SSOT: Toda la lógica de filtros vive EXCLUSIVAMENTE en DrawRepository
    // Eliminamos toda la duplicidad de código que existía aquí
    const filtered = drawRepository.filterDraws(draws as any, filter, now);

    return filtered as Draw[];
  }
}
