import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ValidationRule } from '@/types/rules';

interface RuleUpdateFormData {
    name: string;
    description: string;
    category: string;
    status: string;
    scope: {
        agencyIds: string[];
        allAgencies: boolean;
    };
    validationType: string;
    parameters: Record<string, any>;
    examples: string[];
}

const DEFAULT_FORM_DATA: RuleUpdateFormData = {
    name: '',
    description: '',
    category: 'payment_validation',
    status: 'draft',
    scope: {
        agencyIds: [],
        allAgencies: true,
    },
    validationType: 'range_check',
    parameters: {},
    examples: [],
};

interface UseRuleUpdateReturn {
    // Estados
    loading: boolean;
    saving: boolean;
    rule: ValidationRule | null;
    formData: RuleUpdateFormData;

    // Funciones
    handleSave: () => Promise<void>;
    updateFormField: (field: keyof RuleUpdateFormData, value: any) => void;
    updateScopeField: (field: string, value: any) => void;
    updateParameterField: (key: string, value: any) => void;
    loadRule: (id: string) => Promise<void>;
}

export const useRuleUpdate = (ruleId?: string): UseRuleUpdateReturn => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rule, setRule] = useState<ValidationRule | null>(null);

    const [formData, setFormData] = useState<RuleUpdateFormData>(DEFAULT_FORM_DATA);

    // Load rule data if ruleId is provided
    useEffect(() => {
        if (ruleId) {
            loadRule(ruleId);
        }
    }, [ruleId]);

    const loadRule = useCallback(async (id: string) => {
        try {
            setLoading(true);
            // In real implementation, fetch from API
            // const ruleData = await ValidationRuleService.getById(id);

            // Mock data for now
            const mockRule: ValidationRule = {
                id,
                name: 'Sample Rule',
                description: 'Sample rule description',
                category: 'payment_validation',
                status: 'active',
                scope: { agencyIds: ['agency1'], allAgencies: false },
                validationType: 'range_check',
                parameters: { minAmount: 1, maxAmount: 10000 },
                examples: ['Example 1', 'Example 2'],
                affectedAgencies: ['agency1'],
                modificationHistory: [],
                lastModified: '2024-01-15T10:30:00Z',
                createdAt: '2024-01-10T09:00:00Z',
                version: 1,
            };

            setRule(mockRule);
            setFormData({
                name: mockRule.name,
                description: mockRule.description,
                category: mockRule.category,
                status: mockRule.status,
                scope: mockRule.scope,
                validationType: mockRule.validationType,
                parameters: mockRule.parameters,
                examples: mockRule.examples,
            });
        } catch (error) {
            console.error('Error loading rule:', error);
            Alert.alert('Error', 'No se pudo cargar la regla');
        } finally {
            setLoading(false);
        }
    }, []);

    const validateFormData = useCallback((): boolean => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'El nombre de la regla es obligatorio');
            return false;
        }

        if (!formData.description.trim()) {
            Alert.alert('Error', 'La descripción de la regla es obligatoria');
            return false;
        }

        if (!formData.category) {
            Alert.alert('Error', 'La categoría de la regla es obligatoria');
            return false;
        }

        return true;
    }, [formData.name, formData.description, formData.category]);

    const handleSave = useCallback(async () => {
        // Basic validation
        if (!validateFormData()) {
            return;
        }

        try {
            setSaving(true);

            const ruleData = {
                ...formData,
                lastModified: new Date().toISOString(),
                version: rule?.version ? rule.version + 1 : 1,
            };

            if (ruleId) {
                // Update existing rule
                // await ValidationRuleService.update(ruleId, ruleData);
                console.log('Updating rule:', ruleId, ruleData);
                Alert.alert('Éxito', 'Regla actualizada correctamente');
            } else {
                // Create new rule
                // await ValidationRuleService.create(ruleData);
                console.log('Creating new rule:', ruleData);
                Alert.alert('Éxito', 'Regla creada correctamente');
            }

            // The navigation back is handled in the component

        } catch (error) {
            console.error('Error saving rule:', error);
            Alert.alert('Error', 'No se pudo guardar la regla');
        } finally {
            setSaving(false);
        }
    }, [ruleId, formData, validateFormData, rule]);

    const updateFormField = useCallback((field: keyof RuleUpdateFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateScopeField = useCallback((field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            scope: {
                ...prev.scope,
                [field]: value
            }
        }));
    }, []);

    const updateParameterField = useCallback((key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            parameters: {
                ...prev.parameters,
                [key]: value
            }
        }));
    }, []);

    return {
        // Estados
        loading,
        saving,
        rule,
        formData,

        // Funciones
        handleSave,
        updateFormField,
        updateScopeField,
        updateParameterField,
        loadRule,
    };
};
