import { StatusFilter, DRAW_FILTER } from '../core.types';
import { drawRepository } from '@/shared/repositories/draw';
import { TimerRepository } from '@/shared/repositories/system/time';
import { logger } from '@/shared/utils/logger';
import { DrawType } from '@/types';

const log = logger.withTag('DASHBOARD_LOGIC');

export interface FilterDrawsInput {
  draws: DrawType[];
  filter: StatusFilter;
  currentTime?: number;
}

export const filterDraws = (input: FilterDrawsInput): DrawType[] => {
  const { draws, filter, currentTime } = input;
  const now = currentTime ?? TimerRepository.getTrustedNow(Date.now());

  log.info(`Filtering draws with filter: ${filter}`, { count: draws.length, now });

  return drawRepository.filterDraws(draws, filter, now);
};

export const DRAW_FILTER_OPTIONS = [
  { label: 'Abierto', value: DRAW_FILTER.OPEN },
  { label: 'Próximos', value: DRAW_FILTER.SCHEDULED },
  { label: 'Cerrado', value: DRAW_FILTER.CLOSED },
  { label: 'Premiados', value: DRAW_FILTER.REWARDED },
  { label: 'Todos', value: DRAW_FILTER.ALL },
] as const;