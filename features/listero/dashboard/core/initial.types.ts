import { RemoteData } from '@/shared/core/remote.data';
import { Model } from './model';

export const initialState: Model = {
    draws: RemoteData.notAsked(),
    filteredDraws: [],
    summary: RemoteData.notAsked(),
    dailyTotals: {
        totalCollected: 0,
        premiumsPaid: 0,
        netResult: 0,
        estimatedCommission: 0,
        amountToRemit: 0,
    },
    userStructureId: null,
    statusFilter: 'open',
    appliedFilter: 'open',
    commissionRate: 0.1, // 10% default
};
