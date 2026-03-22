import * as t from 'io-ts';
import { DrawType, DRAW_STATUS } from '@/types';
import { match } from 'ts-pattern';

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

export const isClosingSoon = (bettingEndTime?: string | null) => {
  if (!bettingEndTime) return false;
  const now = new Date();
  const endTime = new Date(bettingEndTime);
  const diff = endTime.getTime() - now.getTime();
  return diff > 0 && diff < 5 * 60 * 1000; // 5 minutes according to feature spec
};

export const isExpired = (draw: Draw) => {
  return match(draw)
    // Estados que definitivamente están expirados
    .with(
      { status: DRAW_STATUS.CLOSED },
      { status: DRAW_STATUS.COMPLETED },
      { status: DRAW_STATUS.REWARDED },
      () => true
    )
    // Estados que definitivamente no están expirados
    .with(
      { status: DRAW_STATUS.OPEN },
      { status: DRAW_STATUS.SCHEDULED },
      { status: DRAW_STATUS.PENDING },
      () => false
    )
    // Fallback: si is_betting_open es true, no está expirado
    .when(
      (d) => d.is_betting_open === true,
      () => false
    )
    // Último recurso: verificación basada en tiempo
    .when(
      (d) => d.betting_end_time != null,
      (d) => {
        const now = new Date();
        const endTime = new Date(d.betting_end_time!);
        return now.getTime() >= endTime.getTime();
      }
    )
    // Valor por defecto
    .otherwise(() => false);
};
