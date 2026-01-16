// Main exports for the Admin dashboard module
// This module handles administrative operations for seed data management

// Core exports
export { useAdminStore, selectModel, selectDispatch } from './core/store';
export type { Model } from './core/model';
export type { Msg } from './core/msg';
export type { AdminSection } from './core/model';

// Feature exports (will be implemented)
// export { RolesScreen } from './roles/screens/RolesScreen';
// export { StructuresScreen } from './structures/screens/StructuresScreen';
// export { UsersScreen } from './users/screens/UsersScreen';
// export { DrawConfigScreen } from './draw-config/screens/DrawConfigScreen';
// export { RulesScreen } from './rules/screens/RulesScreen';
// export { DrawsScreen } from './draws/screens/DrawsScreen';
// export { SeedGeneratorScreen } from './seed-generator/screens/SeedGeneratorScreen';

// Placeholder dashboard screen
export { AdminDashboardScreen } from './screens/AdminDashboardScreen';

// Types for external use
export type {
  Role,
  initialRolesState
} from './roles/roles.types';

export type {
  Structure,
  initialStructuresState
} from './structures/structures.types';

export type {
  User,
  initialUsersState
} from './users/users.types';

export type {
  DrawType,
  BetType,
  ValidationRule,
  RewardRule,
  WinningRule,
  initialDrawConfigState
} from './draw-config/draw-config.types';

export type {
  Rule,
  initialRulesState
} from './rules/rules.types';

export type {
  Draw,
  initialDrawsState
} from './draws/draws.types';

export type {
  SeedData,
  GeneratedScript,
  initialSeedGeneratorState
} from './seed-generator/seed-generator.types';

// Constants
export const ADMIN_SECTIONS = [
  { key: 'roles', label: 'Roles & Permissions', icon: 'team' },
  { key: 'structures', label: 'Organizational Structure', icon: 'apartment' },
  { key: 'users', label: 'User Management', icon: 'user' },
  { key: 'draw-config', label: 'Draw Configuration', icon: 'setting' },
  { key: 'rules', label: 'Rules & Validation', icon: 'safety' },
  { key: 'draws', label: 'Draw Management', icon: 'calendar' },
  { key: 'seed-generator', label: 'Seed Generator', icon: 'code' },
] as const;
