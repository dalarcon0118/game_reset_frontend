// Main Model interface - brings together all state types for admin dashboard
import { UiState } from '../shared/ui.types';
import { Model as RolesState } from '../roles/roles.types';
import { Model as StructuresState } from '../structures/structures.types';
import { Model as UsersState } from '../users/users.types';
import { Model as DrawConfigState } from '../draw-config/draw-config.types';
import { Model as RulesState } from '../rules/rules.types';
import { Model as DrawsState } from '../draws/draws.types';
import { Model as SeedGeneratorState } from '../seed-generator/seed-generator.types';

export interface Model extends UiState {
    // Navigation
    activeSection: AdminSection;

    // Feature states
    rolesState: RolesState;
    structuresState: StructuresState;
    usersState: UsersState;
    drawConfigState: DrawConfigState;
    rulesState: RulesState;
    drawsState: DrawsState;
    seedGeneratorState: SeedGeneratorState;
}

export type AdminSection =
    | 'roles'
    | 'structures'
    | 'users'
    | 'draw-config'
    | 'rules'
    | 'draws'
    | 'seed-generator';
