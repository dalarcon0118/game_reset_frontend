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

export interface BackendStructureRewardRule {
  id: string;
  structure: string;
  rule: BackendRewardRule;
  apply_to_all_children: boolean;
  specific_children: string[];
  priority: number;
  is_active: boolean;
}

export type RewardRule = BackendRewardRule;
export type StructureRewardRule = BackendStructureRewardRule;
