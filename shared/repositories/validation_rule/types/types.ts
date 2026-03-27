export interface BackendValidationRule {
    id: string | number;
    name: string;
    description: string | null;
    json_logic: any;
    is_active: boolean;
    bet_types: (string | number)[];
    created_at: string;
    updated_at: string;
}

export interface BackendStructureValidationRule {
    id: string | number;
    structure: string | number;
    rule: BackendValidationRule;
    apply_to_all_children: boolean;
    specific_children: (string | number)[];
    priority: number;
    is_active: boolean;
}

export interface BackendBetType {
    id: string | number;
    name: string;
    code: string;
}

export interface BackendRuleRepository {
    id: string | number;
    name: string;
    description: string | null;
    rule_type: 'validation' | 'reward';
    json_logic: any;
    bet_types: (string | number)[];
    bet_types_details: BackendBetType[];
    is_template: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BackendStructureSpecificRule {
    id: string | number;
    structure: string | number;
    structure_name: string;
    rule_type: 'validation' | 'reward';
    base_template?: string | number | null;
    base_template_name?: string | number | null;
    name: string;
    description: string | null;
    json_logic: any;
    bet_types: (string | number)[];
    bet_types_details: BackendBetType[];
    apply_to_all_children: boolean;
    specific_children: (string | number)[];
    priority: number;
    is_active: boolean;
    is_modified: boolean;
    created_at: string;
    updated_at: string;
}

export type ValidationRule = BackendValidationRule;
export type StructureValidationRule = BackendStructureValidationRule;
export type RuleRepository = BackendRuleRepository;
export type StructureSpecificRule = BackendStructureSpecificRule;
