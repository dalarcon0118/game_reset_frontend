import { WinningRecord } from '../../../../types';
import { UnifiedRulesResponse } from '../../../../shared/services/rules';

export enum RewardsRulesMsgType {
    FETCH_REWARDS_REQUESTED = 'FETCH_REWARDS_REQUESTED',
    FETCH_REWARDS_SUCCEEDED = 'FETCH_REWARDS_SUCCEEDED',
    FETCH_REWARDS_FAILED = 'FETCH_REWARDS_FAILED',
    FETCH_RULES_REQUESTED = 'FETCH_RULES_REQUESTED',
    FETCH_RULES_SUCCEEDED = 'FETCH_RULES_SUCCEEDED',
    FETCH_RULES_FAILED = 'FETCH_RULES_FAILED',
}

export type RewardsRulesMsg =
    | { type: RewardsRulesMsgType.FETCH_REWARDS_REQUESTED; drawId: string }
    | { type: RewardsRulesMsgType.FETCH_REWARDS_SUCCEEDED; rewards: WinningRecord | null }
    | { type: RewardsRulesMsgType.FETCH_REWARDS_FAILED; error: any }
    | { type: RewardsRulesMsgType.FETCH_RULES_REQUESTED; drawId: string }
    | { type: RewardsRulesMsgType.FETCH_RULES_SUCCEEDED; rules: UnifiedRulesResponse | null }
    | { type: RewardsRulesMsgType.FETCH_RULES_FAILED; error: any };
