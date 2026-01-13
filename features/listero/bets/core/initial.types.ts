import { Model } from './model';
import { initialCreateState } from '../features/create-bet/create.types';
import { initialEditState } from '../features/edit-bet/edit.types';
import { initialParletState } from '../features/parlet/parlet.types';
import { initialListState } from '../features/bet-list/list.types';
import { initialManagementState } from '../features/management/management.types';
import { rewardsCache, rulesCache } from '../features/rewards-rules/rewards.types';

export const initialModel: Model = {
    // UiState
    error: null,

    // Core data
    drawId: null,

    // Sessions
    createSession: initialCreateState,
    editSession: initialEditState,
    parletSession: initialParletState,
    listSession: initialListState,
    managementSession: initialManagementState,

    // Cache
    rewards: rewardsCache,
    rules: rulesCache,
};
