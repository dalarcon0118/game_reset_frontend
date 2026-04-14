// Main Model interface - brings together all state types
import { UiState } from '@/features/listero/bet-workspace/ui/ui.types';
import { Model as CreateSession } from './create/core/types';
import { Model as EditSession } from './edit/core/types';
import { ParletModel as ParletSession, CentenaModel as CentenaSession } from '@/features/listero/bet-bolita/domain/models/bolita.types';
import { RulesModel } from './rules/core/model';
import { LoteriaState } from '@/features/listero/bet-loteria/loteria/loteria.types';
import { ListState } from './list/core/types';
import { ManagementState } from './management/core/types';
import { VoucherModel as SuccessState } from '@/features/listero/bet-workspace/success/core/domain/success.types';
import { WebData } from '@core/tea-utils';
import { ListData as LocalListData, BetSummary as LocalBetSummary } from './core/types';

export type { CreateSession, EditSession };

export type BetSummary = LocalBetSummary;
export type ListData = LocalListData;

export interface RewardsModel {
  status: { type: 'NotAsked' };
  drawId: string | null;
  rewards: any;
  userWinnings: any;
}

export interface Model extends UiState {
    // Core data
    currentDrawId: string | null;
    drawTypeCode: WebData<string>;
    isEditing: boolean;
    summary: BetSummary;
    navigation: any;

    // Sessions
    createSession: CreateSession;
    editSession: EditSession;
    parletSession: ParletSession;
    centenaSession: CentenaSession;
    rulesSession: RulesModel;
    loteriaSession: LoteriaState;
    listSession: ListState;
    entrySession: ListData;
    managementSession: ManagementState;
    successSession: SuccessState;

    // Cache
    rewards: RewardsModel;
}