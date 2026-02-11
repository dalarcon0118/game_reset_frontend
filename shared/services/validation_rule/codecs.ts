import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';

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

export const BackendBetTypeCodec = t.type({
    id: t.string,
    name: t.string,
    code: t.string,
});

export const BackendRuleRepositoryCodec = t.type({
    id: t.string,
    name: t.string,
    description: t.string,
    rule_type: t.union([t.literal('validation'), t.literal('reward')]),
    json_logic: t.unknown,
    bet_types: t.array(t.string),
    bet_types_details: t.array(BackendBetTypeCodec),
    is_template: t.boolean,
    is_active: t.boolean,
    created_at: t.string,
    updated_at: t.string,
});

export const BackendStructureSpecificRuleCodec = t.intersection([
    t.type({
        id: t.string,
        structure: t.string,
        structure_name: t.string,
        rule_type: t.union([t.literal('validation'), t.literal('reward')]),
        name: t.string,
        description: t.string,
        json_logic: t.unknown,
        bet_types: t.array(t.string),
        bet_types_details: t.array(BackendBetTypeCodec),
        apply_to_all_children: t.boolean,
        specific_children: t.array(t.string),
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
    console.warn(`[ValidationRuleApi] ${label} decode failed:`, PathReporter.report(result).join('; '));
    return value as T;
};
