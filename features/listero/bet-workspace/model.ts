// Main Model interface - brings together all state types
import { UiState } from '@/features/listero/bet-workspace/ui/ui.types';
import { Model as CreateSession } from './create/core/types';
import { Model as EditSession } from './edit/core/types';
import { Model as ParletSession } from '@/features/listero/bet-bolita/parlet/parlet.types';
import { Model as CentenaSession } from '@/features/listero/bet-bolita/centena/centena.types';
import { RulesModel as RulesSession } from './rules/core/model';
import { LoteriaState } from '@/features/listero/bet-loteria/loteria/loteria.types';
import { ListState } from './list/core/types';
import { ManagementState } from './management/core/types';
import { VoucherModel as SuccessState } from '@/features/listero/bet-workspace/success/core/domain/success.types';
import { RewardsModel as RewardsCache } from '@/features/listero/bet-workspace/rewards/core/model';
import { RulesModel as RulesCache } from '@/features/listero/bet-workspace/rules/core/model';
import { WebData } from '@/shared/core/tea-utils/remote.data';
import { ListData as LocalListData, BetSummary as LocalBetSummary } from './core/types';

export type { CreateSession, EditSession };

export type BetSummary = LocalBetSummary;
export type ListData = LocalListData;

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
    rulesSession: RulesSession;
    loteriaSession: LoteriaState;
    listSession: ListState;
    entrySession: ListData; // Nueva sesión para apuestas en proceso de anotación
    managementSession: ManagementState;
    successSession: SuccessState;

    // Cache
    rewards: RewardsCache;
    rules: RulesCache;
}