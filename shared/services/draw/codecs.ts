import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DRAW_CODECS');

const DrawTypeDetailsCodec = t.type({
  id: t.number,
  name: t.string,
  description: t.string,
  code: t.string,
});

const ClosureConfirmationsCountCodec = t.type({
  total: t.number,
  pending: t.number,
  confirmed_success: t.number,
  reported_issue: t.number,
  rejected: t.number,
});

// Helper codec for decimal fields that can come as string or number from backend
const DecimalCodec = t.union([t.number, t.string]);

export const BackendDrawCodec = t.intersection([
  t.type({
    id: t.number,
    draw_type: t.number,
    draw_type_details: DrawTypeDetailsCodec,
    total_collected: DecimalCodec,
    premiums_paid: DecimalCodec,
    net_result: DecimalCodec,
    name: t.string,
    draw_datetime: t.string,
    status: t.string,
    owner_structure: t.number,
    created_at: t.string,
    updated_at: t.string,
    closure_confirmations_count: ClosureConfirmationsCountCodec,
    is_betting_open: t.boolean,
  }),
  t.partial({
    description: t.union([t.string, t.null]),
    betting_start_time: t.union([t.string, t.null]),
    betting_end_time: t.union([t.string, t.null]),
    winning_numbers: t.unknown,
    hierarchical_closure_status: t.union([t.string, t.null]),
    extra_data: t.unknown,
  }),
]);

export const BackendDrawArrayCodec = t.array(BackendDrawCodec);

export const DrawClosureConfirmationCodec = t.type({
  id: t.number,
  draw: t.number,
  structure: t.number,
  structure_name: t.string,
  structure_type: t.string,
  confirmed_by: t.number,
  confirmed_by_name: t.string,
  draw_name: t.string,
  status: t.union([
    t.literal('pending'),
    t.literal('confirmed_success'),
    t.literal('reported_issue'),
    t.literal('rejected'),
  ]),
  notes: t.string,
  level_required: t.number,
  is_mandatory: t.boolean,
  requires_notification: t.boolean,
  created_at: t.string,
  updated_at: t.string,
});

export const DrawClosureConfirmationArrayCodec = t.array(DrawClosureConfirmationCodec);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
  const result = codec.decode(value);
  if (isRight(result)) return result.right;
  log.warn(`${label} decode failed`, {
    errors: PathReporter.report(result).join('; ')
  });
  return value as T;
};
