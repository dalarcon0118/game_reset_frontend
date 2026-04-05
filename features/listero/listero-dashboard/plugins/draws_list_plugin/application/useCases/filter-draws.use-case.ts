import { DRAW_STATUS } from '@/types';
import { match } from 'ts-pattern';
import { StatusFilter, isClosingSoon, DRAW_FILTER, Draw } from '../../core/types';
import { TimerRepository } from '@/shared/repositories/system/time';

export interface FilterDrawsInput {
  draws: Draw[];
  filter: StatusFilter;
  currentTime?: number;
}

const isExpiredWithTime = (draw: Draw, now: number): boolean => {
  if (draw.betting_end_time != null) {
    const endTime = new Date(draw.betting_end_time).getTime();
    if (now >= endTime) {
      return true;
    }
  }

  if (draw.status === DRAW_STATUS.CLOSED ||
    draw.status === DRAW_STATUS.COMPLETED ||
    draw.status === DRAW_STATUS.REWARDED) {
    return true;
  }

  return false;
};

const isTimeOpen = (draw: Draw, now: number): boolean => {
  if (draw.is_betting_open === true) return true;

  if (draw.betting_end_time != null) {
    const endTime = new Date(draw.betting_end_time).getTime();
    if (now < endTime) {
      return true;
    }
  }

  return false;
};

export class FilterDrawsUseCase {
  execute(input: FilterDrawsInput): Draw[] {
    const { draws, filter, currentTime } = input;
    const now = currentTime ?? TimerRepository.getTrustedNow(Date.now());

    const filtered = draws.filter((draw) => {
      const expired = isExpiredWithTime(draw, now);
      const timeOpen = isTimeOpen(draw, now);

      return match(filter)
        .with(DRAW_FILTER.ALL, () => true)
        .with(DRAW_FILTER.SCHEDULED, () =>
          (draw.status === DRAW_STATUS.SCHEDULED || draw.status === DRAW_STATUS.PENDING) && !expired
        )
        .with(DRAW_FILTER.OPEN, () =>
          timeOpen && !expired
        )
        .with(DRAW_FILTER.CLOSED, () =>
          expired || draw.status === DRAW_STATUS.CLOSED || draw.status === DRAW_STATUS.REWARDED
        )
        .with(DRAW_FILTER.CLOSING_SOON, () =>
          timeOpen && isClosingSoon(draw.betting_end_time, now)
        )
        .with(DRAW_FILTER.REWARDED, () =>
          draw.status === DRAW_STATUS.REWARDED || (draw as any).is_rewarded === true || !!draw.winning_numbers
        )
        .exhaustive();
    });

    // Sort draws: Open first, then Pending, then by time
    return filtered.sort((a, b) => {
      const aOpen = a.status === DRAW_STATUS.OPEN || a.is_betting_open === true;
      const bOpen = b.status === DRAW_STATUS.OPEN || b.is_betting_open === true;

      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;

      const aPending = a.status === DRAW_STATUS.PENDING;
      const bPending = b.status === DRAW_STATUS.PENDING;

      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      const aTime = a.betting_end_time ? new Date(a.betting_end_time).getTime() : Infinity;
      const bTime = b.betting_end_time ? new Date(b.betting_end_time).getTime() : Infinity;

      return aTime - bTime;
    });
  }
}
