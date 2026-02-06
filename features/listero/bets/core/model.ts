// Main Model interface - brings together all state types
import { UiState } from '../features/bet-ui/ui.types';
import { Model as CreateSession } from '../features/create-bet/create.types';
import { Model as EditSession } from '../features/edit-bet/edit.types';
import { Model as ParletSession } from '../features/parlet/parlet.types';
import { Model as CentenaSession } from '../features/centena/centena.types';
import { Model as RulesSession } from '../features/rules/rules.types';
import { LoteriaState } from '@/features/listero/games/loteria/loteria.types';
import { ListState, ListData } from '../features/bet-list/list.types';
import { ManagementState } from '../features/management/management.types';
import { SuccessState } from '../features/success/success.types';
import { RewardsCache, RulesCache } from '../features/rewards-rules/rewards.types';
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

export const initialSummary: BetSummary = {
    loteriaTotal: 0,
    fijosCorridosTotal: 0,
    parletsTotal: 0,
    centenasTotal: 0,
    grandTotal: 0,
    hasBets: false,
    isSaving: false,
    count: 0
};

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