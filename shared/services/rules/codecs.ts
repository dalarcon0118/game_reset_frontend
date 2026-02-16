import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('RULES_CODECS');

export const BackendValidationRuleCodec = t.type({
  id: t.string,
  name: t.string,
  description: t.string,
  json_logic: t.unknown,
  is_active: t.boolean,
  bet_types: t.array(t.string),
  created_at: t.string,
  updated_at: t.string,
});

export const BackendRewardRuleCodec = t.type({
  id: t.string,
  name: t.string,
  description: t.string,
  json_logic: t.unknown,
  is_active: t.boolean,
  bet_types: t.array(t.string),
  created_at: t.string,
  updated_at: t.string,
});

export const BackendUnifiedRulesResponseCodec = t.type({
  validation_rules: t.array(BackendValidationRuleCodec),
  reward_rules: t.array(BackendRewardRuleCodec),
  structure_id: t.number,
  draw_id: t.number,
  draw_name: t.string,
  structure_name: t.string,
});

export const BackendValidationRuleArrayCodec = t.array(BackendValidationRuleCodec);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
  const result = codec.decode(value);
  if (isRight(result)) return result.right;
  log.warn(`${label} decode failed`, {
    errors: PathReporter.report(result).join('; ')
  });
  return value as T;
};
