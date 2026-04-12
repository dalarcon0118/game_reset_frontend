import { DRAW_STATUS } from '@/types';
import { match } from 'ts-pattern';
import { StatusFilter, isClosingSoon, DRAW_FILTER, Draw, isBettingOpen, isExpired, isScheduled } from '../../core/types';
import { TimerRepository } from '@/shared/repositories/system/time';
import { logger } from '@/shared/utils/logger';

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

    const filtered = draws.filter((draw) => {
      const open = isBettingOpen(draw, now);
      const expired = isExpired(draw, now);
      const scheduled = isScheduled(draw, now);

      if (filter === DRAW_FILTER.OPEN && !open) {
        const startStr = draw.betting_start_time ? new Date(draw.betting_start_time).toLocaleString() : 'N/A';
        const endStr = draw.betting_end_time ? new Date(draw.betting_end_time).toLocaleString() : 'N/A';
        log.debug(`Draw ${draw.id} filtered out from OPEN`, {
          status: draw.status,
          is_betting_open: draw.is_betting_open,
          now: new Date(now).toLocaleString(),
          start: startStr,
          end: endStr
        });
      }

      return match(filter)
        .with(DRAW_FILTER.ALL, () => true)
        .with(DRAW_FILTER.SCHEDULED, () => scheduled)
        .with(DRAW_FILTER.OPEN, () => open)
        .with(DRAW_FILTER.CLOSED, () => expired)
        .with(DRAW_FILTER.CLOSING_SOON, () =>
          open && isClosingSoon(draw.betting_end_time, now)
        )
        .with(DRAW_FILTER.REWARDED, () =>
          draw.status === DRAW_STATUS.REWARDED || (draw as any).is_rewarded === true || !!draw.winning_numbers
        )
        .exhaustive();
    });

    // Sort draws: Open first, then Scheduled/Pending, then by time
    return filtered.sort((a, b) => {
      const aOpen = isBettingOpen(a, now);
      const bOpen = isBettingOpen(b, now);

      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;

      const aScheduled = isScheduled(a, now);
      const bScheduled = isScheduled(b, now);

      if (aScheduled && !bScheduled) return -1;
      if (!aScheduled && bScheduled) return 1;

      const aTime = a.betting_end_time ? new Date(a.betting_end_time).getTime() : Infinity;
      const bTime = b.betting_end_time ? new Date(b.betting_end_time).getTime() : Infinity;

      return aTime - bTime;
    });
  }
}
