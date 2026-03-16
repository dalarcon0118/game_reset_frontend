import { Cmd, RemoteData, Return } from '@core/tea-utils';
import { Model } from './model';
import { Msg, PROMOTION_MSG } from './msg';
import { PromotionState } from '../../../../shared/components/promotion/model';
import * as promotionInitialState from '../../../../shared/components/promotion/initial';
import { ret, singleton } from '@core/tea-utils/return';

import { fetchUserDataCmd } from './commands';

/**
 * Curried constructor for the dashboard model.
 * This allows clean TEA-style composition using Return.andMapCmd
 */
const makeModel = (promotion: PromotionState) => (params?: Partial<Model>): Model => {
    const isReady = (params as any)?.isSystemReady ?? false;
    return {
        status: isReady ? { type: 'LOADING_DATA' } : { type: 'IDLE' },
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
    };
};

export const initialState = (params?: Partial<Model>): Return<Model, Msg> => {
    const isReady = (params as any)?.isSystemReady ?? false;
    const initialCmd = isReady ? fetchUserDataCmd() : Cmd.none;

    return ret<any, Msg>(makeModel, initialCmd)
        .andMapCmd(
            PROMOTION_MSG,
            promotionInitialState.initialState()
        )
        .map((finalBuilder: any) => finalBuilder(params));
};