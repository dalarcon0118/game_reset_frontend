import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('VALIDATION_RULE_CODECS');

// Helper codec for ID fields that can come as string or number from backend
const IdCodec = t.union([t.string, t.number]);

// Helper codec for bet type items that can be string or number
const BetTypeItemCodec = t.union([t.string, t.number]);

export const BackendValidationRuleCodec = t.type({
    id: IdCodec,
    name: t.string,
    description: t.union([t.string, t.null]),
    json_logic: t.unknown,
    is_active: t.boolean,
    bet_types: t.array(BetTypeItemCodec),
    created_at: t.string,
    updated_at: t.string,
});

export const BackendBetTypeCodec = t.type({
    id: IdCodec,
    name: t.string,
    code: t.string,
});

export const BackendRuleRepositoryCodec = t.type({
    id: IdCodec,
    name: t.string,
    description: t.union([t.string, t.null]),
    rule_type: t.union([t.literal('validation'), t.literal('reward')]),
    json_logic: t.unknown,
    bet_types: t.array(BetTypeItemCodec),
    bet_types_details: t.array(BackendBetTypeCodec),
    is_template: t.boolean,
    is_active: t.boolean,
    created_at: t.string,
    updated_at: t.string,
});

export const BackendStructureSpecificRuleCodec = t.intersection([
    t.type({
        id: IdCodec,
        structure: IdCodec,
        structure_name: t.string,
        rule_type: t.union([t.literal('validation'), t.literal('reward')]),
        name: t.string,
        description: t.union([t.string, t.null]),
        json_logic: t.unknown,
        bet_types: t.array(BetTypeItemCodec),
        bet_types_details: t.array(BackendBetTypeCodec),
        apply_to_all_children: t.boolean,
        specific_children: t.array(IdCodec),
        priority: t.number,
        is_active: t.boolean,
        is_modified: t.boolean,
        created_at: t.string,
        updated_at: t.string,
    }),
    t.partial({
        base_template: t.union([t.string, t.null]),
        base_template_name: t.union([t.string, t.null]),
    })
]);

export const BackendValidationRuleArrayCodec = t.array(BackendValidationRuleCodec);
export const BackendStructureSpecificRuleArrayCodec = t.array(BackendStructureSpecificRuleCodec);
export const BackendRuleRepositoryArrayCodec = t.array(BackendRuleRepositoryCodec);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
    const result = codec.decode(value);
    if (isRight(result)) return result.right;
    log.warn(`${label} decode failed`, {
        errors: PathReporter.report(result).join('; ')
    });
    return value as T;
};
