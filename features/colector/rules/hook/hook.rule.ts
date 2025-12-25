import { useState, useEffect, useCallback } from 'react';
import { ValidationRuleService, ValidationRule } from '@shared/services/ValidationRule';

export interface Rule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch structure rules with hierarchy
      const validationRules = await ValidationRuleService.getForCurrentUser(true);
      const mappedRules: Rule[] = validationRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        isActive: rule.is_active,
      }));
      setRules(mappedRules);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch rules'));
      console.error('Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleRule = (ruleId: string) => {
    setRules(prevRules =>
      prevRules.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const refetch = () => {
    fetchRules();
  };

  return {
    rules,
    loading,
    error,
    toggleRule,
    refetch,
  };
}
