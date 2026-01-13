// Main Model interface - brings together all state types
import { UiState } from '../features/bet-ui/ui.types';
import { Model as CreateSession } from '../features/create-bet/create.types';
import { Model as EditSession } from '../features/edit-bet/edit.types';
import { Model as ParletSession } from '../features/parlet/parlet.types';
import { ListState } from '../features/bet-list/list.types';
import { ManagementState } from '../features/management/management.types';
import { RewardsCache, RulesCache } from '../features/rewards-rules/rewards.types';

export type { CreateSession, EditSession };

export interface Model extends UiState {
    // Core data
    drawId: string | null;

    // Sessions
    createSession: CreateSession;
    editSession: EditSession;
    parletSession: ParletSession;
    listSession: ListState;
    managementSession: ManagementState;

    // Cache
    rewards: RewardsCache;
    rules: RulesCache;
}
