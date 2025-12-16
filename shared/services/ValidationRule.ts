import ApiClient from './ApiClient';

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
    static async getForCurrentUser(): Promise<ValidationRule[]> {
        try {
            const response = await ApiClient.get<ValidationRule[]>(
                '/draw/validation-rules/for-current-user/'
            );
            return response;
        } catch (error) {
            console.error('Error fetching validation rules for current user:', error);
            return [];
        }
    }

    /**
     * Get validation rules for a specific structure (bank/listeria)
     * This would require a custom backend endpoint
     */
    static async getByStructure(structureId: string): Promise<ValidationRule[]> {
        try {
            const response = await ApiClient.get<ValidationRule[]>(
                `/draw/validation-rules/by-structure/${structureId}/`
            );
            return response;
        } catch (error) {
            console.error('Error fetching validation rules by structure:', error);
            return [];
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
}
