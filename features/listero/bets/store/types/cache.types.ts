// Cache State types - rewards and rules data caching
import { WinningRecord, UnifiedRulesResponse } from '../../../../types';

export interface RewardsCache {
    data: WinningRecord | null;
    isLoading: boolean;
    error: any;
}

export interface RulesCache {
    data: UnifiedRulesResponse | null;
    isLoading: boolean;
    error: any;
}
