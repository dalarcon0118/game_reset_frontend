import { Model } from './model';
import { initialCreateState } from '../features/create-bet/create.types';
import { initialEditState } from '../features/edit-bet/edit.types';
import { initialParletState } from '../features/parlet/parlet.types';
import { initialCentenaState } from '../features/centena/centena.types';
import { initialRulesState } from '../features/rules/rules.types';
import { initialListState } from '../features/bet-list/list.types';
import { initialLoteriaState } from '@/features/listero/games/loteria/loteria.types';
import { initialManagementState } from '../features/management/management.types';
import { rewardsCache, rulesCache } from '../features/rewards-rules/rewards.types';
import { RemoteData } from '@/shared/core/remote.data';

export const initialModel: Model = {
    // UiState
    error: null,

    // Core data
    drawId: null,
    drawTypeCode: RemoteData.notAsked(),

    // Sessions
    createSession: initialCreateState,
    editSession: initialEditState,
    parletSession: initialParletState,
    centenaSession: initialCentenaState,
    rulesSession: initialRulesState,
    loteriaSession: initialLoteriaState,
    listSession: initialListState,
    managementSession: initialManagementState,

    // Cache
    rewards: rewardsCache,
    rules: rulesCache,
};
