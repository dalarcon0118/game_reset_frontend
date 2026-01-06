import { FETCH_RULES_REQUESTED, Model, Msg, RuleUpdateFormData } from './types';
import { UpdateResult } from '@/shared/core/engine';
import { Cmd } from '@/shared/core/cmd';
import { ValidationRuleService } from '@/shared/services/ValidationRule';
import { RewardRuleService } from '@/shared/services/RewardRule';
import { RelativePathString, router } from 'expo-router';

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
    rules: [],
    loading: false,
    saving: false,
    error: null,
    formData: DEFAULT_FORM_DATA,
    editingRuleId: null,
    originalRule: null,
    currentUrl: '',
};

export const update = (model: Model, msg: Msg): UpdateResult<Model, Msg> => {
    switch (msg.type) {
        case FETCH_RULES_REQUESTED().type:
            return [
                { ...model, loading: true, error: null },
                Cmd.task({
                    task: async () => {
                        // Fetch both validation and reward rules
                        const validationRules = await ValidationRuleService.getForCurrentUser(true);

                        const mappedValidation = validationRules.map(rule => ({
                            id: rule.id,
                            name: rule.name,
                            description: rule.description,
                            isActive: rule.is_active,
                            category: rule.name.toLowerCase().includes('payment') ? 'payment_validation' :
                                rule.name.toLowerCase().includes('draw') ? 'draw_validation' : 'custom',
                            status: rule.is_active ? 'active' : 'inactive',
                            ruleType: 'validation' as const
                        }));

                        return mappedValidation;
                    },
                    onSuccess: (rules: any) => ({ type: 'FETCH_RULES_SUCCEEDED', rules }),
                    onFailure: (err: any) => ({ type: 'FETCH_RULES_FAILED', error: err.message }),
                }) as any
            ];

        case 'FETCH_RULES_SUCCEEDED':
            return [{ ...model, rules: msg.rules, loading: false }, Cmd.none];

        case 'FETCH_RULES_FAILED':
            return [{ ...model, loading: false, error: msg.error }, Cmd.none];

        case 'TOGGLE_RULE_REQUESTED':
            const ruleToToggle = model.rules.find(r => r.id === msg.ruleId);
            if (!ruleToToggle) return [model, Cmd.none];

            const updatedRules = model.rules.map(rule =>
                rule.id === msg.ruleId
                    ? { ...rule, isActive: !rule.isActive, status: !rule.isActive ? 'active' : 'inactive' }
                    : rule
            );

            return [
                { ...model, rules: updatedRules },
                Cmd.task({
                    task: async () => {
                        if (msg.ruleType === 'validation') {
                            return await ValidationRuleService.updateStructureRule(msg.ruleId, {
                                is_active: !ruleToToggle.isActive
                            });
                        } else if (msg.ruleType === 'reward') {
                            // Suponiendo que RewardRuleService tiene un método similar o usa el mismo endpoint genérico
                            // Si no, podemos usar el servicio genérico que maneja StructureSpecificRule
                            return await ValidationRuleService.updateStructureRule(msg.ruleId, {
                                is_active: !ruleToToggle.isActive
                            });
                        }
                        return null;
                    },
                    onSuccess: () => ({ type: 'FETCH_RULES_REQUESTED' }),
                    onFailure: (err: any) => ({ type: 'FETCH_RULES_FAILED', error: err.message }),
                }) as any
            ];

        case 'LOAD_RULE_REQUESTED':
            return [
                { ...model, loading: true, editingRuleId: msg.ruleId },
                Cmd.task({
                    task: async () => {
                        if (msg.ruleType === 'validation') {
                            let rule = await ValidationRuleService.getStructureSpecificRuleById(msg.ruleId);
                            if (!rule) {
                                const baseRule = await ValidationRuleService.get(msg.ruleId);
                                if (!baseRule) throw new Error('Rule not found');
                                return baseRule;
                            }
                            return rule;
                        } else if (msg.ruleType === 'reward') {
                            const rewardRule = await RewardRuleService.get(msg.ruleId);
                            if (!rewardRule) throw new Error('Reward rule not found');
                            return rewardRule;
                        }
                        throw new Error('Unknown rule type');
                    },
                    onSuccess: (rule: any) => ({ type: 'LOAD_RULE_SUCCEEDED', rule }),
                    onFailure: (err: any) => ({ type: 'LOAD_RULE_FAILED', error: err.message }),
                }) as any
            ];

        case 'LOAD_RULE_SUCCEEDED':
            return [
                {
                    ...model,
                    loading: false,
                    originalRule: msg.rule,
                    formData: {
                        name: msg.rule.name,
                        description: msg.rule.description,
                        category: msg.rule.category,
                        status: msg.rule.status,
                        scope: msg.rule.scope,
                        validationType: msg.rule.validationType,
                        parameters: msg.rule.parameters,
                        examples: msg.rule.examples,
                    },
                },
                Cmd.none
            ];

        case 'LOAD_RULE_FAILED':
            return [{ ...model, loading: false, error: msg.error }, Cmd.none];

        case 'FORM_FIELD_UPDATED':
            return [
                {
                    ...model,
                    formData: { ...model.formData, [msg.field]: msg.value }
                },
                Cmd.none
            ];

        case 'SCOPE_FIELD_UPDATED':
            return [
                {
                    ...model,
                    formData: {
                        ...model.formData,
                        scope: { ...model.formData.scope, [msg.field]: msg.value }
                    }
                },
                Cmd.none
            ];

        case 'PARAMETER_FIELD_UPDATED':
            return [
                {
                    ...model,
                    formData: {
                        ...model.formData,
                        parameters: { ...model.formData.parameters, [msg.key]: msg.value }
                    }
                },
                Cmd.none
            ];

        case 'SAVE_RULE_REQUESTED':
            return [
                { ...model, saving: true },
                Cmd.task({
                    task: async () => {
                        console.log('Saving rule...', model.formData);
                        return true;
                    },
                    onSuccess: () => ({ type: 'SAVE_RULE_SUCCEEDED' }),
                    onFailure: (err) => ({ type: 'SAVE_RULE_FAILED', error: err.message }),
                }) as any
            ];

        case 'SAVE_RULE_SUCCEEDED':
            return [{ ...model, saving: false }, Cmd.none];

        case 'SAVE_RULE_FAILED':
            return [{ ...model, saving: false, error: msg.error }, Cmd.none];

        case 'RESET_FORM':
            return [{ ...model, formData: DEFAULT_FORM_DATA, editingRuleId: null, originalRule: null }, Cmd.none];
        case 'ROUTER_GO':
            console.log('ROUTER_GO', msg.url);
            router.push(msg.url as RelativePathString);
            return [{ ...model, formData: DEFAULT_FORM_DATA, editingRuleId: null, originalRule: null }, Cmd.none];
        case 'ROUTER_BACK':
            router.back();
            return [model, Cmd.none];
        default:
            return [model, Cmd.none];
    }
};
