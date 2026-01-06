import { useState, useEffect, useCallback } from 'react';
import { ValidationRule } from '@/types/rules';

export interface Rule {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    category: string;
    status: string;
}

export function useRules() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Mock data for now - in real implementation this would come from API
    const mockRules: ValidationRule[] = [
        {
            id: '1',
            name: 'Payment Amount Validation',
            description: 'Validates payment amounts are within acceptable ranges',
            category: 'payment_validation',
            status: 'active',
            scope: { agencyIds: ['agency1', 'agency2'], allAgencies: false },
            validationType: 'range_check',
            parameters: { minAmount: 1, maxAmount: 10000 },
            examples: ['Payment of $500', 'Payment of $15000 (should fail)'],
            affectedAgencies: ['agency1', 'agency2'],
            modificationHistory: [],
            lastModified: '2024-01-15T10:30:00Z',
            createdAt: '2024-01-10T09:00:00Z',
            version: 1,
        },
        {
            id: '2',
            name: 'Draw Time Validation',
            description: 'Ensures draws are placed within valid time windows',
            category: 'draw_validation',
            status: 'active',
            scope: { agencyIds: [], allAgencies: true },
            validationType: 'business_rule',
            parameters: { minAdvanceHours: 2, maxAdvanceHours: 168 },
            examples: ['Draw placed 1 hour before (should fail)', 'Draw placed 24 hours before (should pass)'],
            affectedAgencies: ['All Agencies'],
            modificationHistory: [],
            lastModified: '2024-01-14T14:20:00Z',
            createdAt: '2024-01-12T11:15:00Z',
            version: 1,
        },
    ];

    const fetchRules = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // In real implementation, fetch from API
            // const validationRules = await ValidationRuleService.getForBanker();
            const mappedRules: Rule[] = mockRules.map(rule => ({
                id: rule.id,
                name: rule.name,
                description: rule.description,
                isActive: rule.status === 'active',
                category: rule.category,
                status: rule.status,
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
                rule.id === ruleId ? { ...rule, isActive: !rule.isActive, status: rule.isActive ? 'inactive' : 'active' } : rule
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
