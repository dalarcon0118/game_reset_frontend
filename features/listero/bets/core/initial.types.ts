import { Model } from './model';
import { initialCreateState } from '../features/create-bet/create.types';
import { initialEditState } from '../features/edit-bet/edit.types';
import { initialParletState } from '../features/parlet/parlet.types';
import { initialCentenaState } from '../features/centena/centena.types';
import { initialRulesState } from '../features/rules/rules.types';
import { initialListState } from '../features/bet-list/list.types';
import { initialLoteriaState } from '@/features/listero/games/loteria/loteria.types';
import { initialManagementState } from '../features/management/management.types';
import { SuccessState } from '../features/success/success.types';
import { createRewardsCache, createRulesCache } from '../features/rewards-rules/rewards.types';
import { RemoteData } from '@/shared/core/remote.data';

export const initialSuccessState: SuccessState = {
    sharingStatus: RemoteData.notAsked(),
};

export const initialSummary = {
    loteriaTotal: 0,
    fijosCorridosTotal: 0,
    parletsTotal: 0,
    centenasTotal: 0,
    grandTotal: 0,
    hasBets: false,
    isSaving: false,
    count: 0,
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