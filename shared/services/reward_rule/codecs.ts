import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';

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

export const BackendRewardRuleArrayCodec = t.array(BackendRewardRuleCodec);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
    const result = codec.decode(value);
    if (isRight(result)) return result.right;
    console.warn(`[RewardRuleApi] ${label} decode failed:`, PathReporter.report(result).join('; '));
    return value as T;
};
