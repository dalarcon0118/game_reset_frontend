import { ValidationRule, RewardRule } from '@/shared/services/rules';
import { RemoteData } from '@/shared/core/remote.data';

export interface UnifiedRule {
    id: string;
    name: string;
    description: string;
    type: 'validation' | 'reward';
    json_logic: any;
    is_active: boolean;
    bet_types: string[];
    created_at: string;
    updated_at: string;
}

export interface RulesStats {
    validationCount: number;
    rewardCount: number;
    total: number;
}

export interface Model {
    rulesList: RemoteData<any, {
        validationRules: ValidationRule[];
        rewardRules: RewardRule[];
        structureName: string;
        drawName: string;
    }>;
    allRules: UnifiedRule[];
    stats: RulesStats;
    isRefreshing: boolean;
    isRulesDrawerVisible: boolean;
    selectedRuleType: 'validation' | 'reward' | null;
    selectedRule: ValidationRule | RewardRule | null;
    currentDrawId: string | null;
}

export const initialRulesState: Model = {
    rulesList: RemoteData.notAsked(),
    allRules: [],
    stats: { validationCount: 0, rewardCount: 0, total: 0 },
    isRefreshing: false,
    isRulesDrawerVisible: false,
    selectedRuleType: null,
    selectedRule: null,
    currentDrawId: null,
};

export enum RulesMsgType {
    FETCH_RULES_REQUESTED = 'FETCH_RULES_REQUESTED',
    REFRESH_RULES_REQUESTED = 'REFRESH_RULES_REQUESTED',
    FETCH_RULES_SUCCEEDED = 'FETCH_RULES_SUCCEEDED',
    FETCH_RULES_FAILED = 'FETCH_RULES_FAILED',
    SHOW_RULES_DRAWER = 'SHOW_RULES_DRAWER',
    HIDE_RULES_DRAWER = 'HIDE_RULES_DRAWER',
    SELECT_RULE = 'SELECT_RULE',
    CLEAR_SELECTION = 'CLEAR_SELECTION',
}

export type RulesMsg =
    | { type: RulesMsgType.FETCH_RULES_REQUESTED; drawId: string }
    | { type: RulesMsgType.REFRESH_RULES_REQUESTED; drawId: string }
    | { type: RulesMsgType.FETCH_RULES_SUCCEEDED; data: { validationRules: ValidationRule[]; rewardRules: RewardRule[]; structureName: string; drawName: string } }
    | { type: RulesMsgType.FETCH_RULES_FAILED; error: any }
    | { type: RulesMsgType.SHOW_RULES_DRAWER; ruleType: 'validation' | 'reward'; rule: ValidationRule | RewardRule }
    | { type: RulesMsgType.HIDE_RULES_DRAWER }
    | { type: RulesMsgType.SELECT_RULE; ruleType: 'validation' | 'reward'; rule: ValidationRule | RewardRule }
    | { type: RulesMsgType.CLEAR_SELECTION };

export type RulesFeatMsg = { type: 'RULES'; payload: RulesMsg };