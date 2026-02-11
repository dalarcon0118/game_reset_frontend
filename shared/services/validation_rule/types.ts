export interface BackendValidationRule {
    id: string;
    name: string;
    description: string;
    json_logic: any;
    is_active: boolean;
    bet_types: string[];
    created_at: string;
    updated_at: string;
}

export interface BackendStructureValidationRule {
    id: string;
    structure: string;
    rule: BackendValidationRule;
    apply_to_all_children: boolean;
    specific_children: string[];
    priority: number;
    is_active: boolean;
}

export interface BackendBetType {
    id: string;
    name: string;
    code: string;
}

export interface BackendRuleRepository {
    id: string;
    name: string;
    description: string;
    rule_type: 'validation' | 'reward';
    json_logic: any;
    bet_types: string[];
    bet_types_details: BackendBetType[];
    is_template: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BackendStructureSpecificRule {
    id: string;
    structure: string;
    structure_name: string;
    rule_type: 'validation' | 'reward';
    base_template?: string | null;
    base_template_name?: string | null;
    name: string;
    description: string;
    json_logic: any;
    bet_types: string[];
    bet_types_details: BackendBetType[];
    apply_to_all_children: boolean;
    specific_children: string[];
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
