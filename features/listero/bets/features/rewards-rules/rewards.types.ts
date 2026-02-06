import { WinningRecord } from '@/types';
import { UnifiedRulesResponse } from '@/shared/services/rules';
import { WebData, RemoteData } from '@/shared/core/remote.data';

export interface RewardsCache {
    status: WebData<WinningRecord | null>;
}

export interface RulesCache {
    status: WebData<UnifiedRulesResponse | null>;
}

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

export type RewardsRulesFeatMsg = { type: 'REWARDS_RULES'; payload: RewardsRulesMsg };

// Factory functions to create fresh cache instances
export const createRewardsCache = (): RewardsCache => ({
    status: RemoteData.notAsked()
});

export const createRulesCache = (): RulesCache => ({
    status: RemoteData.notAsked()
});
