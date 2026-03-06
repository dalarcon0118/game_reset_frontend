import { ValidationRule, RewardRule } from '@/shared/services/rules';
import { RemoteData, WebData } from '@/shared/core/tea-utils/remote.data';

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

export interface RulesListData {
    validationRules: ValidationRule[];
    rewardRules: RewardRule[];
    structureName: string;
    drawName: string;
}

export interface RulesModel {
    rulesList: WebData<RulesListData>;
    allRules: UnifiedRule[];
    stats: RulesStats;
    isRefreshing: boolean;
    isRulesDrawerVisible: boolean;
    selectedRuleType: 'validation' | 'reward' | null;
    selectedRule: ValidationRule | RewardRule | null;
    currentDrawId: string | null;
}

export const initialRulesModel: RulesModel = {
    rulesList: RemoteData.notAsked(),
    allRules: [],
    stats: { validationCount: 0, rewardCount: 0, total: 0 },
    isRefreshing: false,
    isRulesDrawerVisible: false,
    selectedRuleType: null,
    selectedRule: null,
    currentDrawId: null,
};
