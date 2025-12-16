import { useState, useEffect, useCallback } from 'react';
import { ValidationRule, ValidationRuleService } from '@/shared/services/ValidationRule';
import { validateBet, validateBets, filterRulesByBetType, ValidationResult, BetData } from '@/shared/utils/validation';

export interface UseValidationRulesOptions {
    structureId?: string;
    betTypeId?: string;
    autoFetch?: boolean;
}

export interface UseValidationRulesReturn {
    rules: ValidationRule[];
    isLoading: boolean;
    error: Error | null;
    fetchRules: () => Promise<void>;
    validateSingleBet: (betData: BetData) => ValidationResult;
    validateMultipleBets: (bets: BetData[]) => Map<number, ValidationResult>;
    getApplicableRules: (betTypeId?: string) => ValidationRule[];
}

/**
 * Hook to fetch and use validation rules from the backend
 * 
 * @example
 * ```tsx
 * const { rules, validateSingleBet, isLoading } = useValidationRules({
 *   structureId: userStructureId,
 *   betTypeId: 'fijo-bet-type-id',
 *   autoFetch: true
 * });
 * 
 * const result = validateSingleBet({
 *   bet_number: '01',
 *   amount: 150
 * });
 * 
 * if (!result.isValid) {
 *   console.log('Validation errors:', result.failedRules);
 * }
 * ```
 */
export function useValidationRules(options: UseValidationRulesOptions = {}): UseValidationRulesReturn {
    const { structureId, betTypeId, autoFetch = true } = options;

    const [rules, setRules] = useState<ValidationRule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchRules = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let fetchedRules: ValidationRule[];

            if (structureId) {
                // Fetch rules specific to the structure
                fetchedRules = await ValidationRuleService.getByStructure(structureId);
            } else if (betTypeId) {
                // Fetch rules specific to the bet type
                fetchedRules = await ValidationRuleService.getByBetType(betTypeId);
            } else {
                // Fetch all active rules
                fetchedRules = await ValidationRuleService.list({ is_active: true });
            }

            setRules(fetchedRules);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch validation rules');
            setError(error);
            console.error('Error fetching validation rules:', error);
        } finally {
            setIsLoading(false);
        }
    }, [structureId, betTypeId]);

    useEffect(() => {
        if (autoFetch) {
            fetchRules();
        }
    }, [autoFetch, fetchRules]);

    const validateSingleBet = useCallback(
        (betData: BetData): ValidationResult => {
            // Filter rules by bet type if provided in betData
            const applicableRules = betData.bet_type
                ? filterRulesByBetType(rules, betData.bet_type)
                : rules;

            return validateBet(betData, applicableRules);
        },
        [rules]
    );

    const validateMultipleBets = useCallback(
        (bets: BetData[]): Map<number, ValidationResult> => {
            return validateBets(bets, rules);
        },
        [rules]
    );

    const getApplicableRules = useCallback(
        (targetBetTypeId?: string): ValidationRule[] => {
            if (!targetBetTypeId) return rules;
            return filterRulesByBetType(rules, targetBetTypeId);
        },
        [rules]
    );

    return {
        rules,
        isLoading,
        error,
        fetchRules,
        validateSingleBet,
        validateMultipleBets,
        getApplicableRules,
    };
}
