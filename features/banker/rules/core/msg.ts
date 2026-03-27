import { User } from '@/shared/repositories/auth/types/types';
import { ValidationRule } from '@/types/rules';
import { RuleUpdateFormData } from './model';

/**
 * 📢 MESSAGES
 */

export type Msg =
    | { type: 'INIT_SCREEN'; id_structure?: string; ruleId?: string }
    | { type: 'FETCH_RULES_REQUESTED' }
    | { type: 'FETCH_STRUCTURE_RULES_REQUESTED'; id_structure: string }
    | { type: 'FETCH_RULES_SUCCEEDED'; rules: ValidationRule[] }
    | { type: 'FETCH_RULES_FAILED'; error: string }
    | { type: 'TOGGLE_RULE_REQUESTED'; ruleId: string; ruleType: 'validation' | 'reward' | 'winning' }
    | { type: 'TOGGLE_RULE_CONFIRMED'; ruleId: string; ruleType: 'validation' | 'reward' | 'winning' }
    | { type: 'TOGGLE_RULE_CANCELLED' }
    | { type: 'LOAD_RULE_REQUESTED'; ruleId: string }
    | { type: 'LOAD_RULE_SUCCEEDED'; rule: ValidationRule }
    | { type: 'LOAD_RULE_FAILED'; error: string }
    | { type: 'FORM_FIELD_UPDATED'; field: keyof RuleUpdateFormData; value: any }
    | { type: 'SCOPE_FIELD_UPDATED'; field: string; value: any }
    | { type: 'PARAMETER_FIELD_UPDATED'; key: string; value: any }
    | { type: 'SAVE_RULE_REQUESTED' }
    | { type: 'SAVE_RULE_SUCCEEDED' }
    | { type: 'SAVE_RULE_FAILED'; error: string }
    | { type: 'RESET_FORM' }
    | { type: 'CREATE_RULE_REQUESTED' }
    | { type: 'ROUTER_GO'; url: string }
    | { type: 'ROUTER_BACK' }
    | { type: 'NAVIGATE_TO_EDIT'; ruleId: string }
    | { type: 'NAVIGATE_TO_RULE_UPDATE'; ruleId: string }
    | { type: 'NAVIGATE_TO_CREATE' }
    | { type: 'AUTH_USER_SYNCED'; user: User | null };

/**
 * 🛠️ MSG HELPERS (Action Creators)
 */

export const INIT_SCREEN = (id_structure?: string, ruleId?: string) => ({ type: 'INIT_SCREEN', id_structure, ruleId } as const);
export const FETCH_RULES_REQUESTED = () => ({ type: 'FETCH_RULES_REQUESTED' } as const);
export const FETCH_STRUCTURE_RULES_REQUESTED = (id_structure: string) => ({ type: 'FETCH_STRUCTURE_RULES_REQUESTED', id_structure } as const);
export const FETCH_RULES_SUCCEEDED = (rules: ValidationRule[]) => ({ type: 'FETCH_RULES_SUCCEEDED', rules } as const);
export const FETCH_RULES_FAILED = (error: string) => ({ type: 'FETCH_RULES_FAILED', error } as const);
export const TOGGLE_RULE_REQUESTED = (ruleId: string, ruleType: 'validation' | 'reward' | 'winning') => ({ type: 'TOGGLE_RULE_REQUESTED', ruleId, ruleType } as const);
export const TOGGLE_RULE_CONFIRMED = (ruleId: string, ruleType: 'validation' | 'reward' | 'winning') => ({ type: 'TOGGLE_RULE_CONFIRMED', ruleId, ruleType } as const);
export const TOGGLE_RULE_CANCELLED = () => ({ type: 'TOGGLE_RULE_CANCELLED' } as const);
export const LOAD_RULE_REQUESTED = (ruleId: string) => ({ type: 'LOAD_RULE_REQUESTED', ruleId } as const);
export const LOAD_RULE_SUCCEEDED = (rule: ValidationRule) => ({ type: 'LOAD_RULE_SUCCEEDED', rule } as const);
export const LOAD_RULE_FAILED = (error: string) => ({ type: 'LOAD_RULE_FAILED', error } as const);
export const FORM_FIELD_UPDATED = (field: keyof RuleUpdateFormData, value: any) => ({ type: 'FORM_FIELD_UPDATED', field, value } as const);
export const SCOPE_FIELD_UPDATED = (field: string, value: any) => ({ type: 'SCOPE_FIELD_UPDATED', field, value } as const);
export const PARAMETER_FIELD_UPDATED = (key: string, value: any) => ({ type: 'PARAMETER_FIELD_UPDATED', key, value } as const);
export const SAVE_RULE_REQUESTED = () => ({ type: 'SAVE_RULE_REQUESTED' } as const);
export const SAVE_RULE_SUCCEEDED = () => ({ type: 'SAVE_RULE_SUCCEEDED' } as const);
export const SAVE_RULE_FAILED = (error: string) => ({ type: 'SAVE_RULE_FAILED', error } as const);
export const RESET_FORM = () => ({ type: 'RESET_FORM' } as const);
export const CREATE_RULE_REQUESTED = () => ({ type: 'CREATE_RULE_REQUESTED' } as const);
export const ROUTER_BACK = () => ({ type: 'ROUTER_BACK' } as const);
export const ROUTER_GO = (url: string) => ({ type: 'ROUTER_GO', url } as const);
export const NAVIGATE_TO_EDIT = (ruleId: string) => ({ type: 'NAVIGATE_TO_EDIT', ruleId } as const);
export const NAVIGATE_TO_RULE_UPDATE = (ruleId: string) => ({ type: 'NAVIGATE_TO_RULE_UPDATE', ruleId } as const);
export const NAVIGATE_TO_CREATE = () => ({ type: 'NAVIGATE_TO_CREATE' } as const);
