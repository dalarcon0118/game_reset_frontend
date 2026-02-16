import { useState, useEffect, useCallback } from 'react';
import { ValidationRuleService, ValidationRule } from '@shared/services/validation_rule';
import { logger } from '@/shared/utils/logger';
import { useAuth } from '@/shared/context/auth_context';

const log = logger.withTag('COLECTOR_RULES_HOOK');

export interface Rule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export function useRules() {
  const { isAuthenticated, isLoading } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    if (!isAuthenticated || isLoading) {
      log.debug('Skipping rules fetch: Not authenticated or loading auth');
      return;
    }

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
      log.error('Error fetching rules', { error: err });
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
