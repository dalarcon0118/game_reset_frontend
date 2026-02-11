import { DrawRules } from '@/types';

export interface BackendValidationRule {
  id: string;
  name: string;
  description: string;
  json_logic: any;
  is_active: boolean;
  bet_types: string[];
  created_at: string;
  updated_at: string;
}

export interface BackendRewardRule {
  id: string;
  name: string;
  description: string;
  json_logic: any;
  is_active: boolean;
  bet_types: string[];
  created_at: string;
  updated_at: string;
}

export interface BackendUnifiedRulesResponse {
  validation_rules: BackendValidationRule[];
  reward_rules: BackendRewardRule[];
  structure_id: number;
  draw_id: number;
  draw_name: string;
  structure_name: string;
}

export type { DrawRules, BackendValidationRule as ValidationRule, BackendRewardRule as RewardRule, BackendUnifiedRulesResponse as UnifiedRulesResponse };
