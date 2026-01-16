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
EOF && cat > draws/draws.types.ts << 'EOF'
// Types for Draws management feature
export interface Draw {
    id: number;
    name: string;
    description: string;
    draw_type: number;
    draw_type_name: string;
    owner_structure: number;
    owner_structure_name: string;
    draw_datetime: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    betting_start_time: string;
    betting_end_time: string;
    winning_numbers?: any;
    created_at: string;
    updated_at: string;
}

export interface Model {
    draws: Draw[];
    loading: boolean;
    error: string | null;
    selectedDraw: Draw | null;
    isCreateModalOpen: boolean;
    isEditModalOpen: boolean;
    drawTypes: any[];
    structures: any[];
    activeTab: 'scheduled' | 'active' | 'completed';
}

export type Msg =
    | { type: 'FETCH_DRAWS_START' }
    | { type: 'FETCH_DRAWS_SUCCESS'; payload: Draw[] }
    | { type: 'FETCH_DRAWS_ERROR'; payload: string }
    | { type: 'CREATE_DRAW_START'; payload: any }
    | { type: 'CREATE_DRAW_SUCCESS'; payload: Draw }
    | { type: 'CREATE_DRAW_ERROR'; payload: string }
    | { type: 'UPDATE_DRAW_START'; payload: { id: number; data: any } }
    | { type: 'UPDATE_DRAW_SUCCESS'; payload: Draw }
    | { type: 'UPDATE_DRAW_ERROR'; payload: string }
    | { type: 'DELETE_DRAW_START'; payload: number }
    | { type: 'DELETE_DRAW_SUCCESS'; payload: number }
    | { type: 'DELETE_DRAW_ERROR'; payload: string }
    | { type: 'SELECT_DRAW'; payload: Draw | null }
    | { type: 'OPEN_CREATE_MODAL' }
    | { type: 'CLOSE_CREATE_MODAL' }
    | { type: 'OPEN_EDIT_MODAL' }
    | { type: 'CLOSE_EDIT_MODAL' }
    | { type: 'SET_ACTIVE_TAB'; payload: Model['activeTab'] };

export const initialDrawsState: Model = {
    draws: [],
    loading: false,
    error: null,
    selectedDraw: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    drawTypes: [],
    structures: [],
    activeTab: 'scheduled',
};
EOF && cat > seed-generator/seed-generator.types.ts << 'EOF'
// Types for Seed Generator feature
export interface SeedData {
    roles: any[];
    structures: any[];
    users: any[];
    drawTypes: any[];
    rules: any[];
    draws: any[];
}

export interface GeneratedScript {
    content: string;
    filename: string;
    timestamp: string;
}

export interface Model {
    seedData: SeedData;
    generatedScript: GeneratedScript | null;
    loading: boolean;
    error: string | null;
    isPreviewModalOpen: boolean;
    selectedDataTypes: string[];
    availableDataTypes: string[];
}

export type Msg =
    | { type: 'FETCH_SEED_DATA_START' }
    | { type: 'FETCH_SEED_DATA_SUCCESS'; payload: SeedData }
    | { type: 'FETCH_SEED_DATA_ERROR'; payload: string }
    | { type: 'GENERATE_SCRIPT_START'; payload: { dataTypes: string[] } }
    | { type: 'GENERATE_SCRIPT_SUCCESS'; payload: GeneratedScript }
    | { type: 'GENERATE_SCRIPT_ERROR'; payload: string }
    | { type: 'DOWNLOAD_SCRIPT' }
    | { type: 'TOGGLE_DATA_TYPE'; payload: string }
    | { type: 'OPEN_PREVIEW_MODAL' }
    | { type: 'CLOSE_PREVIEW_MODAL' }
    | { type: 'RESET_GENERATOR' };

export const initialSeedGeneratorState: Model = {
    seedData: {
        roles: [],
        structures: [],
        users: [],
        drawTypes: [],
        rules: [],
        draws: [],
    },
    generatedScript: null,
    loading: false,
    error: null,
    isPreviewModalOpen: false,
    selectedDataTypes: ['roles', 'structures', 'users', 'drawTypes', 'rules', 'draws'],
    availableDataTypes: ['roles', 'structures', 'users', 'drawTypes', 'rules', 'draws'],
};
