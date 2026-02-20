// Main Model interface - brings together all state types
import { UiState } from '@/features/bet-workspace/ui/ui.types';
import { Model as CreateSession } from '@/features/bet-workspace/create/create.types';
import { Model as EditSession } from '@/features/bet-workspace/edit/edit.types';
import { Model as ParletSession } from '@/features/bet-bolita/parlet/parlet.types';
import { Model as CentenaSession } from '@/features/bet-bolita/centena/centena.types';
import { Model as RulesSession } from '@/features/bet-workspace/rules/rules.types';
import { LoteriaState } from '@/features/bet-loteria/loteria.types';
import { ListState, ListData as ListStateData } from '@/features/bet-workspace/list/list.types';
import { ManagementState } from '@/features/bet-workspace/management/management.types';
import { SuccessState } from '@/features/bet-workspace/success/success.types';
import { RewardsCache, RulesCache } from '@/features/bet-workspace/rewards/rewards.types';
import { WebData } from '@/shared/core/remote.data';

export type { CreateSession, EditSession };

export interface BetSummary {
    loteriaTotal: number;
    fijosCorridosTotal: number;
    parletsTotal: number;
    centenasTotal: number;
    grandTotal: number;
    hasBets: boolean;
    isSaving: boolean;
    count: number;
}

export interface ListData {
    fijosCorridos: any[];
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