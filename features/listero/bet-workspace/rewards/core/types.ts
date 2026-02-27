import { createMsg } from '@/shared/core/msg';
import { WinningRecord } from '@/types';
import { UnifiedRulesResponse } from '@/shared/services/rules';

export const FETCH_REWARDS_REQUESTED = createMsg<'FETCH_REWARDS_REQUESTED', { drawId: string }>('FETCH_REWARDS_REQUESTED');
export const FETCH_REWARDS_SUCCEEDED = createMsg<'FETCH_REWARDS_SUCCEEDED', WinningRecord | null>('FETCH_REWARDS_SUCCEEDED');
export const FETCH_REWARDS_FAILED = createMsg<'FETCH_REWARDS_FAILED', { error: any }>('FETCH_REWARDS_FAILED');

export const FETCH_RULES_REQUESTED = createMsg<'FETCH_RULES_REQUESTED', { drawId: string }>('FETCH_RULES_REQUESTED');
export const FETCH_RULES_SUCCEEDED = createMsg<'FETCH_RULES_SUCCEEDED', UnifiedRulesResponse | null>('FETCH_RULES_SUCCEEDED');
export const FETCH_RULES_FAILED = createMsg<'FETCH_RULES_FAILED', { error: any }>('FETCH_RULES_FAILED');

export type RewardsMsg =
    | ReturnType<typeof FETCH_REWARDS_REQUESTED>
    | ReturnType<typeof FETCH_REWARDS_SUCCEEDED>
    | ReturnType<typeof FETCH_REWARDS_FAILED>
    | ReturnType<typeof FETCH_RULES_REQUESTED>
    | ReturnType<typeof FETCH_RULES_SUCCEEDED>
    | ReturnType<typeof FETCH_RULES_FAILED>;
