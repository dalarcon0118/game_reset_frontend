import jsonLogic from 'json-logic-js';
import { ValidationRule } from '@/shared/services/ValidationRule';

export interface BetData {
    bet_number: string;
    amount: number;
    bet_type?: string;
    [key: string]: any; // Allow additional fields
}

export interface ValidationResult {
    isValid: boolean;
    failedRules: {
        rule: ValidationRule;
        message: string;
    }[];
}

/**
 * Validates a bet against a set of validation rules using JSON Logic
 */
export function validateBet(
    betData: BetData,
    rules: ValidationRule[]
): ValidationResult {
    const failedRules: { rule: ValidationRule; message: string }[] = [];

    for (const rule of rules) {
        if (!rule.is_active) continue;

        try {
            // Apply JSON Logic rule
            const result = jsonLogic.apply(rule.json_logic, betData);

            // If result is false, the validation failed
            if (result === false) {
                failedRules.push({
                    rule,
                    message: rule.description || `Validation failed: ${rule.name}`,
                });
            }
        } catch (error) {
            console.error(`Error evaluating rule "${rule.name}":`, error);
            // Optionally fail the validation if rule evaluation errors
            failedRules.push({
                rule,
                message: `Error evaluating rule: ${rule.name}`,
            });
        }
    }

    return {
        isValid: failedRules.length === 0,
        failedRules,
    };
}

/**
 * Validates multiple bets at once
 */
export function validateBets(
    bets: BetData[],
    rules: ValidationRule[]
): Map<number, ValidationResult> {
    const results = new Map<number, ValidationResult>();

    bets.forEach((bet, index) => {
        results.set(index, validateBet(bet, rules));
    });

    return results;
}

/**
 * Filter rules by bet type
 */
export function filterRulesByBetType(
    rules: ValidationRule[],
    betTypeId: string
): ValidationRule[] {
    return rules.filter(
        (rule) =>
            rule.bet_types.length === 0 || // Rules with no bet types apply to all
            rule.bet_types.includes(betTypeId)
    );
}

/**
 * Get all error messages from validation results
 */
export function getValidationErrors(result: ValidationResult): string[] {
    return result.failedRules.map((fr) => fr.message);
}
