import { createMsg } from '@/shared/core/tea-utils/msg';
import { ValidationRule, RewardRule } from '@/shared/services/rules';
import { RulesListData } from './model';

export const FETCH_RULES_REQUESTED = createMsg<'FETCH_RULES_REQUESTED', { drawId: string }>('FETCH_RULES_REQUESTED');
export const REFRESH_RULES_REQUESTED = createMsg<'REFRESH_RULES_REQUESTED', { drawId: string }>('REFRESH_RULES_REQUESTED');
export const FETCH_RULES_SUCCEEDED = createMsg<'FETCH_RULES_SUCCEEDED', RulesListData>('FETCH_RULES_SUCCEEDED');
export const FETCH_RULES_FAILED = createMsg<'FETCH_RULES_FAILED', { error: any }>('FETCH_RULES_FAILED');
export const SHOW_RULES_DRAWER = createMsg<'SHOW_RULES_DRAWER', { ruleType: 'validation' | 'reward'; rule: ValidationRule | RewardRule }>('SHOW_RULES_DRAWER');
export const HIDE_RULES_DRAWER = createMsg<'HIDE_RULES_DRAWER'>('HIDE_RULES_DRAWER');
export const SELECT_RULE = createMsg<'SELECT_RULE', { ruleType: 'validation' | 'reward'; rule: ValidationRule | RewardRule }>('SELECT_RULE');
export const CLEAR_SELECTION = createMsg<'CLEAR_SELECTION'>('CLEAR_SELECTION');

export type RulesMsg =
    | ReturnType<typeof FETCH_RULES_REQUESTED>
    | ReturnType<typeof REFRESH_RULES_REQUESTED>
    | ReturnType<typeof FETCH_RULES_SUCCEEDED>
    | ReturnType<typeof FETCH_RULES_FAILED>
    | ReturnType<typeof SHOW_RULES_DRAWER>
    | ReturnType<typeof HIDE_RULES_DRAWER>
    | ReturnType<typeof SELECT_RULE>
    | ReturnType<typeof CLEAR_SELECTION>;
