import ApiClient, { ApiClientError } from '../services/ApiClient';
import { createStream } from '../utils/generators';
import { transformTemplatesWithStatus, generatorToArray } from '../utils/generators';

export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    json_logic: any; // JSON Logic object
    is_active: boolean;
    bet_types: string[]; // Array of BetType IDs
    created_at: string;
    updated_at: string;
}

export interface StructureValidationRule {
    id: string;
    structure: string;
    rule: ValidationRule;
    apply_to_all_children: boolean;
    specific_children: string[];
    priority: number;
    is_active: boolean;
}

// New interfaces for the updated rule system
export interface RuleRepository {
    id: string;
    name: string;
    description: string;
    rule_type: 'validation' | 'reward';
    json_logic: any;
    bet_types: string[];
    bet_types_details: BetType[];
    is_template: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface StructureSpecificRule {
    id: string;
    structure: string;
    structure_name: string;
    rule_type: 'validation' | 'reward';
    base_template?: string;
    base_template_name?: string;
    name: string;
    description: string;
    json_logic: any;
    bet_types: string[];
    bet_types_details: BetType[];
    apply_to_all_children: boolean;
    specific_children: string[];
    priority: number;
    is_active: boolean;
    is_modified: boolean;
    created_at: string;
    updated_at: string;
}

interface BetType {
    id: string;
    name: string;
    code: string;
}

export class ValidationRuleService {
    /**
     * Get all validation rules
     */
    static async list(params?: { is_active?: boolean }): Promise<ValidationRule[]> {
        try {
            let endpoint = '/draw/validation-rules/';
            if (params?.is_active !== undefined) {
                const queryParams = new URLSearchParams();
                queryParams.append('is_active', params.is_active.toString());
                endpoint += `?${queryParams.toString()}`;
            }
            const response = await ApiClient.get<ValidationRule[]>(endpoint);
            return response;
        } catch (error) {
            console.error('Error fetching validation rules:', error);
            return [];
        }
    }

    /**
     * Get validation rules for the current authenticated user's structure
     * The structure ID is extracted from the JWT token on the backend
     */
    static async getForCurrentUser(includeHierarchy: boolean = false): Promise<ValidationRule[]> {
        try {
            const queryParams = includeHierarchy ? '?include_hierarchy=true' : '';
            const response = await ApiClient.get<ValidationRule[]>(
                `/draw/validation-rules/for-current-user/${queryParams}`
            );
            return response;
        } catch (error) {
            console.error('Error fetching validation rules for current user:', error);
            if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
                throw error;
            }
            return [];
        }
    }

    /**
     * Get validation rules for a specific structure (bank/listeria)
     * Updated to use the new StructureSpecificRule system
     */
    static async getByStructure(structureId: string): Promise<StructureSpecificRule[]> {
        try {
            const response = await ApiClient.get<StructureSpecificRule[]>(
                `/draw/structure-specific-rules/by-structure/${structureId}/`
            );
            return response;
        } catch (error) {
            console.error('Error fetching validation rules by structure:', error);
            return [];
        }
    }

    /**
     * Get all available rule templates that can be copied to structures
     * Versión tradicional con await - mantiene compatibilidad
     */
    static async getAvailableTemplates(): Promise<RuleRepository[]> {
        return await ApiClient.get<RuleRepository[]>('/draw/structure-specific-rules/available-templates/')
    }



    /**
     * Get available templates with status usando yield * (MÉTODO RECOMENDADO)
     * Demuestra composición perfecta con generadores:
     * 1. getAvailableTemplatesGenerator() -> yield templates
     * 2. transformTemplatesWithStatus() -> yield* transformación
     * 3. generatorToArray() -> convierte a array para compatibilidad
     */
    static async getAvailableTemplatesWithStatus(): Promise<(RuleRepository & { isActivated: boolean })[]> {
        const generator = createStream(() => this.getAvailableTemplates());
        const transformedGenerator = transformTemplatesWithStatus(generator);
        return generatorToArray(transformedGenerator);
    }

    /**
     * Copy a rule template to a specific structure
     */
    static async copyTemplateToStructure(
        templateId: string,
        structureId: string,
        options?: {
            apply_to_all_children?: boolean;
            specific_children?: string[];
            priority?: number;
        }
    ): Promise<StructureSpecificRule> {
        try {
            const response = await ApiClient.post<StructureSpecificRule>(
                `/draw/rule-repository/${templateId}/copy-to-structure/${structureId}/`,
                options || {}
            );
            return response;
        } catch (error) {
            console.error('Error copying rule template to structure:', error);
            throw error;
        }
    }

    /**
     * Update a structure-specific rule
     */
    static async updateStructureRule(
        ruleId: string,
        updates: Partial<StructureSpecificRule>
    ): Promise<StructureSpecificRule> {
        try {
            const response = await ApiClient.put<StructureSpecificRule>(
                `/draw/structure-specific-rules/${ruleId}/`,
                updates
            );
            return response;
        } catch (error) {
            console.error('Error updating structure rule:', error);
            throw error;
        }
    }

    /**
     * Delete a structure-specific rule
     */
    static async deleteStructureRule(ruleId: string): Promise<void> {
        try {
            await ApiClient.delete(`/draw/structure-specific-rules/${ruleId}/`);
        } catch (error) {
            console.error('Error deleting structure rule:', error);
            throw error;
        }
    }

    /**
     * Get validation rules for a specific bet type
     */
    static async getByBetType(betTypeId: string): Promise<ValidationRule[]> {
        try {
            const response = await ApiClient.get<ValidationRule[]>(
                `/draw/validation-rules/?bet_type=${betTypeId}`
            );
            return response;
        } catch (error) {
            console.error('Error fetching validation rules by bet type:', error);
            return [];
        }
    }

    /**
     * Get a single validation rule by ID
     */
    static async get(id: string): Promise<ValidationRule | null> {
        try {
            const response = await ApiClient.get<ValidationRule>(`/draw/validation-rules/${id}/`);
            return response;
        } catch (error) {
            console.error('Error fetching validation rule:', error);
            return null;
        }
    }

    /**
     * Get a single structure-specific rule by ID
     */
    static async getStructureSpecificRuleById(id: string): Promise<StructureSpecificRule | null> {
        try {
            console.log('Fetching structure-specific rule:', id);
            const response = await ApiClient.get<StructureSpecificRule>(`/draw/structure-specific-rules/${id}/`);
            console.log('Structure-specific rule response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching structure-specific rule:', error);
            return null;
        }
    }
}
