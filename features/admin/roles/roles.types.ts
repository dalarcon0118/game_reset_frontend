// Types for Roles management feature - based on backend models
export interface Role {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    users?: UserRole[];
}

export interface UserRole {
    id: number;
    user: number;
    user_username?: string;
    role: number;
    assigned_at: string;
    is_active: boolean;
}

export interface Model {
    roles: Role[];
    loading: boolean;
    error: string | null;
    selectedRole: Role | null;
    isCreateModalOpen: boolean;
    isEditModalOpen: boolean;
}

export type Msg =
    | { type: 'FETCH_ROLES_START' }
    | { type: 'FETCH_ROLES_SUCCESS'; payload: Role[] }
    | { type: 'FETCH_ROLES_ERROR'; payload: string }
    | { type: 'CREATE_ROLE_START'; payload: Omit<Role, 'id' | 'created_at' | 'updated_at'> }
    | { type: 'CREATE_ROLE_SUCCESS'; payload: Role }
    | { type: 'CREATE_ROLE_ERROR'; payload: string }
    | { type: 'UPDATE_ROLE_START'; payload: { id: number; data: Partial<Role> } }
    | { type: 'UPDATE_ROLE_SUCCESS'; payload: Role }
    | { type: 'UPDATE_ROLE_ERROR'; payload: string }
    | { type: 'DELETE_ROLE_START'; payload: number }
    | { type: 'DELETE_ROLE_SUCCESS'; payload: number }
    | { type: 'DELETE_ROLE_ERROR'; payload: string }
    | { type: 'SELECT_ROLE'; payload: Role | null }
    | { type: 'OPEN_CREATE_MODAL' }
    | { type: 'CLOSE_CREATE_MODAL' }
    | { type: 'OPEN_EDIT_MODAL' }
    | { type: 'CLOSE_EDIT_MODAL' };

export const initialRolesState: Model = {
    roles: [],
    loading: false,
    error: null,
    selectedRole: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,
};
