import { ValidationRule } from '@/types/rules';
import { getFixedAmountFromRules, filterRulesByBetType } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('LOTERIA_DOMAIN');

/**
 * Default fixed amount for Loteria bets when no rules are present.
 * This value can be updated in the future without breaking the flow.
 */
export const DEFAULT_LOTERIA_FIXED_AMOUNT = 150;

/**
 * Calculates the fixed amount for a Loteria bet based on the available rules and configuration.
 * This centralizes the logic that was previously duplicated in update and hooks.
 */
export const calculateLoteriaFixedAmount = (
    validationRules: ValidationRule[],
    loteriaBetTypeId: string | null
): number | null => {

    // Log initial parameters for debugging
    log.debug('Calculating fixed amount', {
        ruleCount: validationRules.length,
        targetTypeId: loteriaBetTypeId
    });

    const betTypeRules = loteriaBetTypeId
        ? filterRulesByBetType(validationRules, loteriaBetTypeId)
        : validationRules.filter(r => {
            const name = (r.name || '').toUpperCase();
            return name.includes('LOTERIA') ||
                name.includes('LOTERÍA') ||
                name.includes('CUATERNA');
        });

    const amount = getFixedAmountFromRules(betTypeRules);

    log.debug('Calculation result', {
        filteredRulesCount: betTypeRules.length,
        calculatedAmount: amount
    });

    return amount;
};

/**
 * Determines if the amount keyboard should be shown based on fixed amount configuration.
 */
export const shouldShowAmountInput = (fixedAmount: number | null): boolean => {
    return fixedAmount === null;
};
