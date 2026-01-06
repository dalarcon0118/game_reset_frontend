import { DrawType } from '@/types';

export interface BetLimit {
  fijo: number;
  corrido: number;
  parlet: number;
  centena: number;
}

export interface PrizePerDollar {
  fijo: number;
  corrido: number;
  parlet: number;
  centena: number;
}

export interface LimitedPrizePerDollar {
  fijo: number;
  corrido: number;
  parlet: number;
  centena: number;
}

export interface ProfitPercentage {
  fijo: number;
  corrido: number;
  parlet: number;
  centena: number;
}

export interface LimitedNumbers {
  day: string[];
  night: string[];
}

export interface ParletLimits {
  day: string[];
  night: string[];
}

export interface DrawRules {
  drawId: string;
  betLimits: BetLimit;
  prizesPerDollar: PrizePerDollar;
  limitedPrizesPerDollar: LimitedPrizePerDollar;
  profitPercentage: ProfitPercentage;
  limitedNumbers: LimitedNumbers;
  parletLimits: ParletLimits;
}

// Banker Rules Management Types
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  status: RuleStatus;
  scope: RuleScope;
  validationType: ValidationType;
  parameters: Record<string, any>;
  examples: string[];
  affectedAgencies: string[];
  modificationHistory: ModificationRecord[];
  effectivenessMetrics?: EffectivenessMetrics;
  lastModified: string;
  createdAt: string;
  version: number;
}

export type RuleCategory =
  | 'payment_validation'
  | 'draw_validation'
  | 'user_validation'
  | 'financial_limits'
  | 'compliance'
  | 'custom';

export type RuleStatus = 'active' | 'inactive' | 'draft';

export interface RuleScope {
  agencyIds: string[];
  allAgencies: boolean;
}

export type ValidationType =
  | 'range_check'
  | 'format_validation'
  | 'business_rule'
  | 'cross_reference'
  | 'custom_logic';

export interface ModificationRecord {
  id: string;
  userId: string;
  userName: string;
  action: 'created' | 'modified' | 'activated' | 'deactivated' | 'deleted';
  timestamp: string;
  changes: Record<string, any>;
  notes?: string;
}

export interface EffectivenessMetrics {
  validationSuccessRate: number;
  falsePositives: number;
  falseNegatives: number;
  usageFrequency: number;
  affectedTransactions: number;
  agencyCompliance: number;
}

export interface RuleFilter {
  category?: RuleCategory;
  status?: RuleStatus;
  agencyId?: string;
  search?: string;
}

export interface RuleConflict {
  type: 'parameter_conflict' | 'scope_overlap' | 'logic_conflict' | 'performance_impact';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedRules: string[];
  resolution?: string;
}

export interface BulkRuleOperation {
  ruleIds: string[];
  operation: 'activate' | 'deactivate' | 'change_category' | 'assign_agencies' | 'delete';
  parameters?: Record<string, any>;
}
