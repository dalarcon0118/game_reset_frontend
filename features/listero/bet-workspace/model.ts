// Main Model interface - brings together all state types
import { UiState } from '@/features/listero/bet-workspace/ui/ui.types';
import { Model as CreateSession } from '@/_legacy/workspace/create/create.types';
import { Model as EditSession } from '@/_legacy/workspace/edit/edit.types';
import { Model as ParletSession } from '@/features/listero/bet-bolita/parlet/parlet.types';
import { Model as CentenaSession } from '@/features/listero/bet-bolita/centena/centena.types';
import { Model as RulesSession } from '@/_legacy/workspace/rules/rules.types';
import { LoteriaState } from '@/features/listero/bet-loteria/loteria/loteria.types';
import { ListState, ListData as ListStateData } from '@/_legacy/workspace/list/list.types';
import { ManagementState } from '@/features/bet-workspace/management/management.types';
import { SuccessState } from '@/features/bet-workspace/success/success.types';
import { RewardsCache, RulesCache } from '@/_legacy/workspace/rewards/rewards.types';
import { WebData } from '@/shared/core/remote.data';

export type { CreateSession, EditSession };

export interface BetSummary {
    loteriaTotal: number;
    parletsTotal: number;
    centenasTotal: number;
    grandTotal: number;
    hasBets: boolean;
    isSaving: boolean;
    count: number;
}

export interface ListData {
    parlets: any[];
    centenas: any[];
    loteria: any[];
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