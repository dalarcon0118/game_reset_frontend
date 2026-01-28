// Types for Users management feature
export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    is_active: boolean;
    date_joined: string;
    roles: Role[];
    structures: UserStructure[];
}

export interface Role {
    id: number;
    name: string;
    description: string;
}

export interface UserStructure {
    id: number;
    structure_id: number;
    structure_name: string;
    role: string;
}

export interface Model {
    users: User[];
    loading: boolean;
    error: string | null;
    selectedUser: User | null;
    isCreateModalOpen: boolean;
    isEditModalOpen: boolean;
    availableRoles: Role[];
    availableStructures: any[];
}

export type Msg =
    | { type: 'FETCH_USERS_START' }
    | { type: 'FETCH_USERS_SUCCESS'; payload: User[] }
    | { type: 'FETCH_USERS_ERROR'; payload: string }
    | { type: 'CREATE_USER_START'; payload: any }
    | { type: 'CREATE_USER_SUCCESS'; payload: User }
    | { type: 'CREATE_USER_ERROR'; payload: string }
    | { type: 'UPDATE_USER_START'; payload: { id: number; data: any } }
    | { type: 'UPDATE_USER_SUCCESS'; payload: User }
    | { type: 'UPDATE_USER_ERROR'; payload: string }
    | { type: 'DELETE_USER_START'; payload: number }
    | { type: 'DELETE_USER_SUCCESS'; payload: number }
    | { type: 'DELETE_USER_ERROR'; payload: string }
    | { type: 'SELECT_USER'; payload: User | null }
    | { type: 'OPEN_CREATE_MODAL' }
    | { type: 'CLOSE_CREATE_MODAL' }
    | { type: 'OPEN_EDIT_MODAL' }
    | { type: 'CLOSE_EDIT_MODAL' };

export const initialUsersState: Model = {
    users: [],
    loading: false,
    error: null,
    selectedUser: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    availableRoles: [],
    availableStructures: [],
};
