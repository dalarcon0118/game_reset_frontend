// Types for Draw Configuration feature
export interface DrawType {
    id: number;
    name: string;
    code: string;
    description: string;
    period: any;
    bet_types: BetType[];
}

export interface BetType {
    id: number;
    name: string;
    code: string;
    description: string;
    draw_type: number;
    winning_rule?: WinningRule;
    reward_rules: RewardRule[];
    validation_rules: ValidationRule[];
}

export interface WinningRule {
    id: number;
    name: string;
    description: string;
    json_logic: any;
}

export interface RewardRule {
    id: number;
    name: string;
    description: string;
    json_logic: any;
    is_active: boolean;
}

export interface ValidationRule {
    id: number;
    name: string;
    description: string;
    json_logic: any;
    is_active: boolean;
}

export interface Model {
    drawTypes: DrawType[];
    loading: boolean;
    error: string | null;
    selectedDrawType: DrawType | null;
    selectedBetType: BetType | null;
    isCreateModalOpen: boolean;
    activeTab: 'draw-types' | 'bet-types' | 'rules';
}

export type Msg =
    | { type: 'FETCH_DRAW_TYPES_START' }
    | { type: 'FETCH_DRAW_TYPES_SUCCESS'; payload: DrawType[] }
    | { type: 'FETCH_DRAW_TYPES_ERROR'; payload: string }
    | { type: 'CREATE_DRAW_TYPE_START'; payload: any }
    | { type: 'CREATE_DRAW_TYPE_SUCCESS'; payload: DrawType }
    | { type: 'CREATE_DRAW_TYPE_ERROR'; payload: string }
    | { type: 'SELECT_DRAW_TYPE'; payload: DrawType | null }
    | { type: 'SELECT_BET_TYPE'; payload: BetType | null }
    | { type: 'OPEN_CREATE_MODAL' }
    | { type: 'CLOSE_CREATE_MODAL' }
    | { type: 'SET_ACTIVE_TAB'; payload: Model['activeTab'] };

export const initialDrawConfigState: Model = {
    drawTypes: [],
    loading: false,
    error: null,
    selectedDrawType: null,
    selectedBetType: null,
    isCreateModalOpen: false,
    activeTab: 'draw-types',
};
