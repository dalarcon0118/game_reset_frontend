import { Model } from './model';
import { initialRolesState } from '../roles/roles.types';
import { initialStructuresState } from '../structures/structures.types';
import { initialUsersState } from '../users/users.types';
import { initialDrawConfigState } from '../draw-config/draw-config.types';
import { initialRulesState } from '../rules/rules.types';
import { initialDrawsState } from '../draws/draws.types';
import { initialSeedGeneratorState } from '../seed-generator/seed-generator.types';

export const initialModel: Model = {
    // UiState (inherited from UiState interface)
    error: null,
    loading: false,
    notifications: [],

    // Navigation
    activeSection: 'roles',

    // Feature states
    rolesState: initialRolesState,
    structuresState: initialStructuresState,
    usersState: initialUsersState,
    drawConfigState: initialDrawConfigState,
    rulesState: initialRulesState,
    drawsState: initialDrawsState,
    seedGeneratorState: initialSeedGeneratorState,
};
