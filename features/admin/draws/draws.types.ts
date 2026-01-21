// Types for Draws management feature - based on backend models
export interface Draw {
    id: number;
    name: string;
    description?: string;
    draw_type: number;
    draw_type_name?: string;
    owner_structure: number;
    owner_structure_name?: string;
    draw_datetime: string;
    betting_start_time?: string;
    betting_end_time?: string;
    status: 'scheduled' | 'open' | 'closed' | 'completed' | 'cancelled';
    status_closed?: 'success' | 'reported';
    winning_numbers?: number; // ForeignKey to WinningRecord
    winning_numbers_string?: string; // For display
    extra_data?: any; // Dynamic metadata like jackpot, currency, etc.
    created_at: string;
    updated_at: string;
    closure_confirmations?: DrawClosureConfirmation[];
}

export interface DrawClosureConfirmation {
    id: number;
    draw: number;
    structure: number;
    structure_name?: string;
    confirmed_by: number;
    confirmed_by_username?: string;
    status: 'pending' | 'confirmed_success' | 'reported_issue' | 'rejected';
    notes?: string;
    level_required: number;
    is_mandatory: boolean;
    requires_notification: boolean;
    created_at: string;
    updated_at: string;
}

export interface DrawType {
    id: number;
    name: string;
    code?: string;
    description?: string;
    period: any; // JSONField with scheduling rules
    created_at: string;
    updated_at: string;
    extra_data?: any; // Dynamic metadata like ui_theme, jackpot_display, etc.
    bet_types?: BetType[];
}

export interface BetType {
    id: number;
    draw_type: number;
    draw_type_name?: string;
    name: string;
    code: string;
    winning_rule?: number;
    winning_rule_name?: string;
    description?: string;
    created_at: string;
    updated_at: string;
    validation_rules?: ValidationRule[];
    reward_rules?: RewardRule[];
}

export interface ValidationRule {
    id: number;
    name: string;
    description?: string;
    json_logic: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    bet_types?: number[];
}

export interface RewardRule {
    id: number;
    name: string;
    description?: string;
    json_logic: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    bet_types?: number[];
}

export interface WinningRule {
    id: number;
    name: string;
    description?: string;
    json_logic: any;
    is_active: boolean;
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
