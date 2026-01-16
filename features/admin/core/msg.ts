// Combined MsgType enum and Msg union type for admin dashboard
import { AdminSection } from './model';
import { Notification } from '../shared/ui.types';

// Feature message types (will be imported from each feature)
// import { Msg as RolesMsg } from '../roles/roles.types';
// import { Msg as StructuresMsg } from '../structures/structures.types';
// etc.

export type Msg =
    // Navigation
    | { type: 'NAVIGATE_TO_SECTION'; payload: AdminSection }

    // Feature wrapped messages
    | { type: 'ROLES_MSG'; payload: any }
    | { type: 'STRUCTURES_MSG'; payload: any }
    | { type: 'USERS_MSG'; payload: any }
    | { type: 'DRAW_CONFIG_MSG'; payload: any }
    | { type: 'RULES_MSG'; payload: any }
    | { type: 'DRAWS_MSG'; payload: any }
    | { type: 'SEED_GENERATOR_MSG'; payload: any }

    // Global UI messages
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'REMOVE_NOTIFICATION'; payload: string };
