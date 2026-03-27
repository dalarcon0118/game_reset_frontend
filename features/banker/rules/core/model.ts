import { ValidationRule, RuleStatus, RuleCategory, RuleScope, ValidationType } from '@/types/rules';
import { WebData, RemoteData } from '@core/tea-utils';
import { IndexPath } from '@ui-kitten/components';

/**
 * 📊 VIEW MODELS
 * All presentation logic must live in these selectors to ensure SRP.
 */

export interface RuleListItemViewModel {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    ruleType: 'validation' | 'reward' | 'winning';
    ruleTypeLabel: string;
    ruleTypeTone: 'primary' | 'success';
    toggleLabel: 'ON' | 'OFF';
    status: RuleStatus;
}

export interface RuleEditViewModel {
    data: WebData<{
        id: string;
        formData: RuleUpdateFormData;
    }>;
    saving: WebData<void>;
    statusOptions: { label: string; value: string }[];
    selectedStatusIndex: number;
    selectedStatusPath: IndexPath;
    categoryOptions: { label: string; value: RuleCategory }[];
    selectedCategoryPath: IndexPath;
    validationTypeOptions: { label: string; value: ValidationType }[];
    selectedValidationTypePath: IndexPath;
}

export interface RuleUpdateFormData {
    name: string;
    description: string;
    category: RuleCategory;
    status: RuleStatus;
    scope: RuleScope;
    validationType: ValidationType;
    parameters: Record<string, any>;
    examples: string[];
}

/**
 * 🧱 CORE MODEL
 * Flat and deterministic state representation.
 */

export interface ValidationErrors {
    name?: string;
    description?: string;
    category?: string;
    status?: string;
    scope?: string;
    validationType?: string;
    parameters?: string;
}

export interface Model {
    id_structure: string | null;
    rules: WebData<ValidationRule[]>;
    saving: WebData<void>;
    editing: WebData<{
        id: string;
        formData: RuleUpdateFormData;
    }>;
    confirmToggle: { ruleId: string; ruleType: 'validation' | 'reward' | 'winning' } | null;
    error: string | null; // For transient errors not captured by RemoteData
    validationErrors: ValidationErrors;
}

export const DEFAULT_FORM_DATA: RuleUpdateFormData = {
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

export const initialState: Model = {
    id_structure: null,
    rules: RemoteData.notAsked(),
    saving: RemoteData.notAsked(),
    editing: RemoteData.notAsked(),
    confirmToggle: null,
    error: null,
    validationErrors: {},
};

/**
 * 🎯 SELECTORS
 */

export const selectRules = (model: Model) => model.rules;

export interface RulesListViewModel {
    rules: WebData<RuleListItemViewModel[]>;
    confirmToggle: { ruleId: string; ruleType: string; ruleName: string } | null;
}

export const selectRulesListViewModel = (model: Model): RulesListViewModel => {
    const rules = RemoteData.map(
        (rules) =>
            rules.map((rule) => ({
                id: rule.id,
                name: rule.name,
                description: rule.description,
                isActive: rule.status === 'active',
                ruleType: 'validation' as const,
                ruleTypeLabel: rule.category.replace('_', ' ').toUpperCase(),
                ruleTypeTone: rule.status === 'active' ? 'primary' as const : 'success' as const,
                toggleLabel: rule.status === 'active' ? 'ON' as const : 'OFF' as const,
                status: rule.status,
            })),
        model.rules
    );

    const confirmToggle = model.confirmToggle ? {
        ...model.confirmToggle,
        ruleName: RemoteData.fold({
            notAsked: () => 'esta regla',
            loading: () => 'esta regla',
            failure: () => 'esta regla',
            success: (rules) => rules.find(r => r.id === model.confirmToggle?.ruleId)?.name || 'esta regla'
        }, model.rules) as string
    } : null;

    return {
        rules,
        confirmToggle
    };
};

export const selectRuleEditViewModel = (model: Model): RuleEditViewModel => {
    const statusOptions = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
        { label: 'Borrador', value: 'draft' },
    ];

    const categoryOptions: { label: string; value: RuleCategory }[] = [
        { label: 'Validación de Pago', value: 'payment_validation' },
        { label: 'Validación de Sorteo', value: 'draw_validation' },
        { label: 'Validación de Usuario', value: 'user_validation' },
        { label: 'Límites Financieros', value: 'financial_limits' },
        { label: 'Cumplimiento', value: 'compliance' },
        { label: 'Personalizado', value: 'custom' },
    ];

    const validationTypeOptions: { label: string; value: ValidationType }[] = [
        { label: 'Chequeo de Rango', value: 'range_check' },
        { label: 'Validación de Formato', value: 'format_validation' },
        { label: 'Regla de Negocio', value: 'business_rule' },
        { label: 'Referencia Cruzada', value: 'cross_reference' },
        { label: 'Lógica Personalizada', value: 'custom_logic' },
    ];

    const { currentStatus, currentCategory, currentValidationType } = RemoteData.fold(
        {
            notAsked: () => ({ currentStatus: 'draft', currentCategory: 'custom', currentValidationType: 'custom_logic' }),
            loading: () => ({ currentStatus: 'draft', currentCategory: 'custom', currentValidationType: 'custom_logic' }),
            failure: () => ({ currentStatus: 'draft', currentCategory: 'custom', currentValidationType: 'custom_logic' }),
            success: ({ formData }) => ({
                currentStatus: formData.status,
                currentCategory: formData.category,
                currentValidationType: formData.validationType
            }),
        },
        model.editing
    );

    const selectedStatusIndex = Math.max(0, statusOptions.findIndex((opt) => opt.value === currentStatus));
    const selectedCategoryIndex = Math.max(0, categoryOptions.findIndex((opt) => opt.value === currentCategory));
    const selectedValidationTypeIndex = Math.max(0, validationTypeOptions.findIndex((opt) => opt.value === currentValidationType));

    return {
        data: model.editing,
        saving: model.saving,
        statusOptions,
        selectedStatusIndex,
        selectedStatusPath: new IndexPath(selectedStatusIndex),
        categoryOptions,
        selectedCategoryPath: new IndexPath(selectedCategoryIndex),
        validationTypeOptions,
        selectedValidationTypePath: new IndexPath(selectedValidationTypeIndex),
    };
};

/**
 * UTILS
 */

export const ruleToFormData = (rule: ValidationRule): RuleUpdateFormData => ({
    name: rule.name,
    description: rule.description,
    category: rule.category,
    status: rule.status,
    scope: rule.scope,
    validationType: rule.validationType,
    parameters: rule.parameters,
    examples: rule.examples,
});
