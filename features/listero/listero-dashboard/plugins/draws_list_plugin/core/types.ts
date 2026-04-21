import * as t from 'io-ts';
import { DrawType, DRAW_STATUS } from '@/types';
import { match } from 'ts-pattern';
import { RepositoriesModule, ITimeRepository } from '@/shared/repositories';

export const DrawCodec = t.intersection([
  t.type({
    id: t.union([t.string, t.number]),
    status: t.string,
  }),
  t.partial({
    source: t.string,
    date: t.string,
    betting_start_time: t.union([t.string, t.null]),
    betting_end_time: t.union([t.string, t.null]),
    betting_start_time_display: t.union([t.string, t.null]),
    betting_end_time_display: t.union([t.string, t.null]),
    is_betting_open: t.boolean,
    category: t.union([t.literal('bolita'), t.literal('loteria'), t.undefined]),
    code: t.union([t.string, t.undefined]),
    winning_numbers: t.union([t.any, t.null]),
    is_rewarded: t.boolean,
    totalCollected: t.number,
    premiumsPaid: t.number,
    netResult: t.number,
    _offline: t.partial({
      pendingCount: t.number,
      localAmount: t.number,
      backendAmount: t.number,
      hasDiscrepancy: t.boolean,
    }),
  })
]);

export type Draw = t.TypeOf<typeof DrawCodec>;

export const DRAW_FILTER = {
  ALL: 'all',
  OPEN: 'open',
  CLOSED: 'closed',
  CLOSING_SOON: 'closing_soon',
  REWARDED: 'rewarded',
  SCHEDULED: 'scheduled',
} as const;

export type StatusFilter = typeof DRAW_FILTER[keyof typeof DRAW_FILTER];

export const isClosingSoon = (bettingEndTime?: string | null, now?: number) => {
  if (!bettingEndTime) return false;
  const timerRepo = RepositoriesModule.getSync<ITimeRepository>('TimerRepository');
  const currentTime = now ?? timerRepo.getTrustedNow(Date.now());
  const endTime = new Date(bettingEndTime).getTime();
  const diff = endTime - currentTime;
  return diff > 0 && diff < 5 * 60 * 1000; // 5 minutes according to feature spec
};

export const isExpired = (draw: Draw, currentTime?: number) => {
  const timerRepo = RepositoriesModule.getSync<ITimeRepository>('TimerRepository');
  const now = currentTime ?? timerRepo.getTrustedNow(Date.now());

  // VERIFICACIÓN BASADA EN HORAS ÚNICAMENTE
  // Un sorteo está expirado si ya pasó la hora de cierre
  if (draw.betting_end_time) {
    const endTime = new Date(draw.betting_end_time).getTime();
    if (now >= endTime) return true;
  }

  return false;
};

export const isBettingOpen = (draw: Draw, currentTime?: number) => {
  const timerRepo = RepositoriesModule.getSync<ITimeRepository>('TimerRepository');
  const now = currentTime ?? timerRepo.getTrustedNow(Date.now());

  // VERIFICACIÓN BASADA EN HORAS ÚNICAMENTE
  // Ignoramos el status del backend - solo las horas definen si está abierto
  // betting_start_time < now < betting_end_time
  const hasStartTime = !!draw.betting_start_time;
  const hasEndTime = !!draw.betting_end_time;

  if (hasStartTime && hasEndTime) {
    const startTime = new Date(draw.betting_start_time!).getTime();
    const endTime = new Date(draw.betting_end_time!).getTime();
    return now >= startTime && now < endTime;
  }

  if (hasEndTime) {
    const endTime = new Date(draw.betting_end_time!).getTime();
    return now < endTime;
  }

  return false; // Si no hay horarios definidos, no está abierto
};

export const isScheduled = (draw: Draw, currentTime?: number) => {
  if (isExpired(draw, currentTime) || isBettingOpen(draw, currentTime)) return false;
  
  const timerRepo = RepositoriesModule.getSync<ITimeRepository>('TimerRepository');
  const now = currentTime ?? timerRepo.getTrustedNow(Date.now());

  if (draw.betting_start_time) {
    const startTime = new Date(draw.betting_start_time).getTime();
    if (now < startTime) return true;
  }

  return draw.status === DRAW_STATUS.SCHEDULED || draw.status === DRAW_STATUS.PENDING;
};
