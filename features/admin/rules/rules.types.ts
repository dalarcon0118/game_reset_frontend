// Types for Rules management feature
export interface Rule {
    id: number;
    name: string;
    description: string;
    json_logic: any;
    is_active: boolean;
    rule_type: 'validation' | 'reward' | 'winning';
    bet_types: number[];
    created_at: string;
    updated_at: string;
}

export interface Model {
    rules: Rule[];
    loading: boolean;
    error: string | null;
    selectedRule: Rule | null;
    isCreateModalOpen: boolean;
    isEditModalOpen: boolean;
    activeTab: 'validation' | 'reward' | 'winning';
    betTypes: any[];
}

export type Msg =
    | { type: 'FETCH_RULES_START' }
    | { type: 'FETCH_RULES_SUCCESS'; payload: Rule[] }
    | { type: 'FETCH_RULES_ERROR'; payload: string }
    | { type: 'CREATE_RULE_START'; payload: any }
    | { type: 'CREATE_RULE_SUCCESS'; payload: Rule }
    | { type: 'CREATE_RULE_ERROR'; payload: string }
    | { type: 'UPDATE_RULE_START'; payload: { id: number; data: any } }
    | { type: 'UPDATE_RULE_SUCCESS'; payload: Rule }
    | { type: 'UPDATE_RULE_ERROR'; payload: string }
    | { type: 'DELETE_RULE_START'; payload: number }
    | { type: 'DELETE_RULE_SUCCESS'; payload: number }
    | { type: 'DELETE_RULE_ERROR'; payload: string }
    | { type: 'SELECT_RULE'; payload: Rule | null }
    | { type: 'OPEN_CREATE_MODAL' }
    | { type: 'CLOSE_CREATE_MODAL' }
    | { type: 'OPEN_EDIT_MODAL' }
    | { type: 'CLOSE_EDIT_MODAL' }
    | { type: 'SET_ACTIVE_TAB'; payload: Model['activeTab'] };

export const initialRulesState: Model = {
    rules: [],
    loading: false,
    error: null,
    selectedRule: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    activeTab: 'validation',
    betTypes: [],
};
