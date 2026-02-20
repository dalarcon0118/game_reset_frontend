import { Model } from './model';
import { initialCreateState } from '@/features/bet-workspace/create/create.types';
import { initialEditState } from '@/features/bet-workspace/edit/edit.types';
import { initialParletState } from '@/features/bet-bolita/parlet/parlet.types';
import { initialCentenaState } from '@/features/bet-bolita/centena/centena.types';
import { initialRulesState } from '@/features/bet-workspace/rules/rules.types';
import { initialListState } from '@/features/bet-workspace/list/list.types';
import { initialLoteriaState } from '@/features/bet-loteria/loteria.types';
import { initialManagementState } from '@/features/bet-workspace/management/management.types';
import { SuccessState } from '@/features/bet-workspace/success/success.types';
import { createRewardsCache, createRulesCache } from '@/features/bet-workspace/rewards/rewards.types';
import { RemoteData } from '@/shared/core/remote.data';
import { initialSummary } from './summary.utils';

export const initialSuccessState: SuccessState = {
    sharingStatus: RemoteData.notAsked(),
};

export const initialModel: Model = {
    // UiState
    error: null,

    // Core data
    currentDrawId: null,
    drawTypeCode: RemoteData.notAsked(),
    isEditing: false,
    summary: initialSummary,
    navigation: null,

    // Sessions
    createSession: initialCreateState,
    editSession: initialEditState,
    parletSession: initialParletState,
    centenaSession: initialCentenaState,
    rulesSession: initialRulesState,
    loteriaSession: initialLoteriaState,
    listSession: initialListState,
    entrySession: {
        fijosCorridos: [],
        parlets: [],
        centenas: [],
        loteria: []
    }, // Nueva sesión inicializada con listas vacías
    managementSession: initialManagementState,
    successSession: initialSuccessState,

    // Cache
    rewards: createRewardsCache(),
    rules: createRulesCache(),
};
