import { BackendUnifiedRulesResponse as UnifiedRulesResponse, BackendValidationRule as ValidationRule } from './api/types/types';
import { DrawRules } from '@/types';

export { UnifiedRulesResponse, ValidationRule };

export interface IRulesRepository {
    // Legacy Mock Methods
    get(drawId: string): Promise<DrawRules | null>;
    list(): Promise<DrawRules[]>;
    filter(criteria: {
        drawId?: string;
        minBetLimit?: number;
        maxBetLimit?: number;
        minPrize?: number;
        maxPrize?: number;
    }): Promise<DrawRules[]>;

    // API Methods
    getAllRulesForDraw(drawId: string): Promise<UnifiedRulesResponse | null>;
    getValidationRulesForCurrentUser(): Promise<ValidationRule[]>;
    getValidationRulesByStructure(structureId: string): Promise<ValidationRule[]>;
}
