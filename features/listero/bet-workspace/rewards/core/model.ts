import { WinningRecord } from '@/types';
import { UnifiedRulesResponse } from '@/shared/services/rules';
import { WebData, RemoteData } from '@/shared/core/tea-utils/remote.data';

export interface RewardsModel {
    rewards: {
        status: WebData<WinningRecord | null>;
    };
    rules: {
        status: WebData<UnifiedRulesResponse | null>;
    };
    currentDrawId: string | null;
}

export const initialRewardsModel: RewardsModel = {
    rewards: {
        status: RemoteData.notAsked(),
    },
    rules: {
        status: RemoteData.notAsked(),
    },
    currentDrawId: null,
};
