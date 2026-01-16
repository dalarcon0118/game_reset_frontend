// Types for Structures management feature - based on backend models
export interface Structure {
    id: number;
    name: string;
    node_type: 'bank' | 'branch' | 'zone' | 'LISTERO' | 'COLLECTOR' | 'other';
    custom_type?: string; // Used when node_type is 'other'
    description?: string;
    parent?: number;
    parent_name?: string;
    level: number;
    path: string;
    created_at: string;
    updated_at: string;
    children?: Structure[];
    user_assignments?: UserStructure[];
}

export interface UserStructure {
    id: number;
    user: number;
    user_username?: string;
    structure: number;
    assigned_at: string;
    is_active: boolean;
    role: string;
}

export interface Model {
    structures: Structure[];
    loading: boolean;
    error: string | null;
    selectedStructure: Structure | null;
    expandedNodes: Set<number>;
    isCreateModalOpen: boolean;
    isEditModalOpen: boolean;
    treeData: Structure[];
}

export type Msg =
    | { type: 'FETCH_STRUCTURES_START' }
    | { type: 'FETCH_STRUCTURES_SUCCESS'; payload: Structure[] }
    | { type: 'FETCH_STRUCTURES_ERROR'; payload: string }
    | { type: 'CREATE_STRUCTURE_START'; payload: Omit<Structure, 'id' | 'level' | 'path' | 'created_at' | 'updated_at' | 'children'> }
    | { type: 'CREATE_STRUCTURE_SUCCESS'; payload: Structure }
    | { type: 'CREATE_STRUCTURE_ERROR'; payload: string }
    | { type: 'UPDATE_STRUCTURE_START'; payload: { id: number; data: Partial<Structure> } }
    | { type: 'UPDATE_STRUCTURE_SUCCESS'; payload: Structure }
    | { type: 'UPDATE_STRUCTURE_ERROR'; payload: string }
    | { type: 'DELETE_STRUCTURE_START'; payload: number }
    | { type: 'DELETE_STRUCTURE_SUCCESS'; payload: number }
    | { type: 'DELETE_STRUCTURE_ERROR'; payload: string }
    | { type: 'SELECT_STRUCTURE'; payload: Structure | null }
    | { type: 'TOGGLE_NODE_EXPANDED'; payload: number }
    | { type: 'OPEN_CREATE_MODAL' }
    | { type: 'CLOSE_CREATE_MODAL' }
    | { type: 'OPEN_EDIT_MODAL' }
    | { type: 'CLOSE_EDIT_MODAL' };

export const initialStructuresState: Model = {
    structures: [],
    loading: false,
    error: null,
    selectedStructure: null,
    expandedNodes: new Set(),
    isCreateModalOpen: false,
    isEditModalOpen: false,
    treeData: [],
};
