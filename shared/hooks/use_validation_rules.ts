import { useState, useEffect, useCallback } from 'react';
import { ValidationRuleRepository, BackendValidationRule as ValidationRule } from '@/shared/repositories/validation_rule';
import { validateBet, validateBets, filterRulesByBetType, ValidationResult, BetData } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('USE_VALIDATION_RULES');

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
 *   log.debug('Validation errors', { failedRules: result.failedRules });
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
            let fetchedRules: any[];

            if (structureId) {
                // Fetch rules specific to the structure
                fetchedRules = await ValidationRuleRepository.getByStructure(structureId);
            } else if (betTypeId) {
                // Fetch rules specific to the bet type
                fetchedRules = await ValidationRuleRepository.getByBetType(betTypeId);
            } else {
                // Fetch all active rules
                fetchedRules = await ValidationRuleRepository.list({ is_active: true });
            }

            setRules(fetchedRules);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch validation rules');
            setError(error);
            log.error('Error fetching validation rules', { error, structureId, betTypeId });
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
                ? filterRulesByBetType(rules as any, betData.bet_type)
                : rules as any;

            return validateBet(betData, applicableRules);
        },
        [rules]
    );

    const validateMultipleBets = useCallback(
        (bets: BetData[]): Map<number, ValidationResult> => {
            return validateBets(bets, rules as any);
        },
        [rules]
    );

    const getApplicableRules = useCallback(
        (targetBetTypeId?: string): ValidationRule[] => {
            if (!targetBetTypeId) return rules;
            return filterRulesByBetType(rules as any, targetBetTypeId) as any;
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
