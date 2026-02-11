import { DrawType, DRAW_STATUS } from '@/types';
import { match } from 'ts-pattern';
import { StatusFilter, isExpired, isClosingSoon, DRAW_FILTER } from '../../core/types';

export interface FilterDrawsInput {
  draws: DrawType[];
  filter: StatusFilter;
}

export class FilterDrawsUseCase {
  execute(input: FilterDrawsInput): DrawType[] {
    const { draws, filter } = input;

    const filtered = draws.filter((draw) => {
      const expired = isExpired(draw);

      return match(filter)
        .with(DRAW_FILTER.ALL, () => true)
        .with(DRAW_FILTER.SCHEDULED, () =>
          (draw.status === DRAW_STATUS.SCHEDULED || draw.status === DRAW_STATUS.PENDING) && !expired
        )
        .with(DRAW_FILTER.OPEN, () =>
          draw.status === DRAW_STATUS.OPEN && !expired
        )
        .with(DRAW_FILTER.CLOSED, () =>
          (draw.status === DRAW_STATUS.CLOSED || expired) && !draw.winning_numbers
        )
        .with(DRAW_FILTER.CLOSING_SOON, () =>
          (draw.status === DRAW_STATUS.OPEN || draw.is_betting_open === true) && isClosingSoon(draw.betting_end_time)
        )
        .with(DRAW_FILTER.REWARDED, () =>
          (draw.status as string) === DRAW_STATUS.REWARDED || (draw as any).is_rewarded === true || !!draw.winning_numbers
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
