import { Cmd, RemoteData, Return } from '@core/tea-utils';
import { logger } from '@/shared/utils/logger';
import { Model } from './model';
import { Msg, PROMOTION_MSG, SyncStatus } from './msg';
import { PromotionState } from '../../../../shared/components/promotion/model';
import * as promotionInitialState from '../../../../shared/components/promotion/initial';
import { ret } from '@core/tea-utils/return';

import { fetchUserDataCmd } from './commands';

const log = logger.withTag('DASHBOARD_INIT');

const makeModel = (promotion: PromotionState, showBalance: boolean = true) => (params?: Partial<Model>): Model => {
  const isReady = (params as any)?.isSystemReady ?? false;
  const userStructureId = params?.userStructureId || null;

  return {
    status: isReady ? { type: 'LOADING_DATA' } : { type: 'IDLE' },
    draws: RemoteData.notAsked(),
    filteredDraws: [],
    pendingBets: [],
    syncedBets: [],
    userStructureId,
    statusFilter: 'all',
    appliedFilter: 'all',
    commissionRate: 0,
    showBalance,
    authToken: null,
    currentUser: null,
    isRateLimited: false,
    promotion,
    needsPasswordChange: false,
    financialSummary: RemoteData.notAsked(),
    totalsByDrawId: new Map(),
    trustedNow: Date.now(),
    syncStatus: 'idle' as SyncStatus,
    ...params,
  };
};

export const initialState = (params?: Partial<Model>): Return<Model, Msg> => {
  const isReady = (params as any)?.isSystemReady ?? false;
  const userStructureId = params?.userStructureId || null;

  const initialCmd = isReady
    ? (userStructureId ? Cmd.ofMsg({ type: 'FETCH_DATA_REQUESTED', structureId: userStructureId }) : fetchUserDataCmd())
    : Cmd.none;

  return ret<any, Msg>(makeModel, initialCmd)
    .andMapCmd(
      PROMOTION_MSG,
      promotionInitialState.initialState()
    )
    .map((finalBuilder: any) => finalBuilder(params));
};