import { Cmd, RemoteData, Return } from '@core/tea-utils';
import { Model } from './model';
import { Msg, PROMOTION_MSG } from './msg';
import { PromotionState } from '../promotion/model';
import * as promotionInitialState from '../promotion/initial';

/**
 * Curried constructor for the dashboard model.
 * This allows clean TEA-style composition using Return.andMapCmd
 */
const makeModel = (promotion: PromotionState) => (params?: Partial<Model>): Model => ({
    status: { type: 'IDLE' },
    draws: RemoteData.notAsked(),
    filteredDraws: [],
    pendingBets: [],
    syncedBets: [],
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
    commissionRate: 0,
    showBalance: true,
    authToken: null,
    currentUser: null,
    isRateLimited: false,
    promotion,
    ...params,
});

export const initialState = (params?: Partial<Model>): Return<Model, Msg> => {
    return Return.singleton(makeModel)
        .andMapCmd(
            PROMOTION_MSG,
            promotionInitialState.initialState()
        )
        .map(finalBuilder => finalBuilder(params));
};