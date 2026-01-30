import { match } from 'ts-pattern';
import { Model, Msg, RuleUpdateFormData } from './types';
import { UpdateResult } from '../../../../shared/core/engine';
import { Cmd } from '../../../../shared/core/cmd';
import { ValidationRuleService } from '../../../../shared/services/validation_rule';
import { singleton, ret, Return } from '../../../../shared/core/return';
import { Sub, SubDescriptor } from '../../../../shared/core/sub';
import { useAuthStore } from '../../../../features/auth/store/store';

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
    currentUser: null,
};

export const init = (): UpdateResult<Model, Msg> => {
    return [
        initialState,
        Cmd.batch([
            Cmd.task({
                task: async () => {
                    const validationRules = await ValidationRuleService.getForCurrentUser(true);
                    return validationRules.map(rule => ({
                        id: rule.id,
                        name: rule.name,
                        description: rule.description,
                        isActive: rule.is_active,
                        category: rule.name.toLowerCase().includes('payment') ? 'payment_validation' :
                            rule.name.toLowerCase().includes('draw') ? 'draw_validation' : 'custom',
                        status: rule.is_active ? 'active' : 'inactive',
                        ruleType: 'validation' as const
                    }));
                },
                onSuccess: (rules: any) => ({ type: 'FETCH_RULES_SUCCEEDED', rules }),
                onFailure: (err: any) => ({ type: 'FETCH_RULES_FAILED', error: err.message }),
            })
        ])
    ];
};

export const subscriptions = (_model: Model): SubDescriptor<Msg> => {
    // Sincronización automática con el store de Auth
    const authSub = Sub.watchStore(
        useAuthStore,
        (state: any) => state.model?.user || state.user,
        (user) => ({ type: 'AUTH_USER_SYNCED', user }),
        'banker-rules-auth-sync'
    );

    return Sub.batch([authSub]);
};

export const update = (model: Model, msg: Msg): UpdateResult<Model, Msg> => {
    const result = match<Msg, Return<Model, Msg>>(msg)
        .with({ type: 'AUTH_USER_SYNCED' }, ({ user }) => {
            return singleton({ ...model, currentUser: user });
        })
        .with({ type: 'FETCH_RULES_REQUESTED' }, () => {
            return ret(
                { ...model, loading: true, error: null },
                Cmd.task({
                    task: async () => {
                        const validationRules = await ValidationRuleService.getForCurrentUser(true);
                        return validationRules.map(rule => ({
                            id: rule.id,
                            name: rule.name,
                            description: rule.description,
                            isActive: rule.is_active,
                            category: rule.name.toLowerCase().includes('payment') ? 'payment_validation' :
                                rule.name.toLowerCase().includes('draw') ? 'draw_validation' : 'custom',
                            status: rule.is_active ? 'active' : 'inactive',
                            ruleType: 'validation' as const
                        }));
                    },
                    onSuccess: (rules: any) => ({ type: 'FETCH_RULES_SUCCEEDED', rules }),
                    onFailure: (err: any) => ({ type: 'FETCH_RULES_FAILED', error: err.message }),
                })
            );
        })

        .with({ type: 'FETCH_RULES_SUCCEEDED' }, ({ rules }) => {
            return singleton({ ...model, rules, loading: false });
        })

        .with({ type: 'FETCH_RULES_FAILED' }, ({ error }) => {
            return singleton({ ...model, loading: false, error });
        })

        .with({ type: 'TOGGLE_RULE_REQUESTED' }, ({ ruleId, ruleType }) => {
            const ruleToToggle = model.rules.find(r => r.id === ruleId);
            if (!ruleToToggle) return singleton(model);

            const structureId = model.currentUser?.structure?.id;

            const updatedRules = model.rules.map(rule =>
                rule.id === ruleId
                    ? { ...rule, isActive: !rule.isActive, status: !rule.isActive ? 'active' : 'inactive' }
                    : rule
            );

            return ret(
                { ...model, rules: updatedRules },
                Cmd.task({
                    task: async () => {
                        const updates: any = {
                            is_active: !ruleToToggle.isActive
                        };

                        // Si tenemos structureId, lo incluimos para satisfacer unique_together
                        if (structureId) {
                            updates.structure = structureId;
                        }

                        if (ruleType === 'validation') {
                            return await ValidationRuleService.updateStructureRule(ruleId, updates);
                        } else if (ruleType === 'reward') {
                            return await ValidationRuleService.updateStructureRule(ruleId, updates);
                        }
                        return null;
                    },
                    onSuccess: () => ({ type: 'FETCH_RULES_REQUESTED' }),
                    onFailure: (err: any) => ({ type: 'FETCH_RULES_FAILED', error: err.message }),
                })
            );
        })

        .with({ type: 'LOAD_RULE_REQUESTED' }, ({ ruleId }) => {
            // NOTE: We assume 'validation' by default if type is not specified in message
            // or we could add ruleType to the message if needed.
            return ret(
                { ...model, loading: true, editingRuleId: ruleId },
                Cmd.task({
                    task: async () => {
                        let rule = await ValidationRuleService.getStructureSpecificRuleById(ruleId);
                        if (!rule) {
                            const baseRule = await ValidationRuleService.get(ruleId);
                            if (!baseRule) throw new Error('Rule not found');
                            return baseRule;
                        }
                        return rule;
                    },
                    onSuccess: (rule: any) => ({ type: 'LOAD_RULE_SUCCEEDED', rule }),
                    onFailure: (err: any) => ({ type: 'LOAD_RULE_FAILED', error: err.message }),
                })
            );
        })

        .with({ type: 'LOAD_RULE_SUCCEEDED' }, ({ rule }) => {
            return singleton({
                ...model,
                loading: false,
                originalRule: rule,
                formData: {
                    name: rule.name,
                    description: rule.description,
                    category: rule.category,
                    status: rule.status,
                    scope: rule.scope,
                    validationType: rule.validationType,
                    parameters: rule.parameters,
                    examples: rule.examples,
                },
            });
        })

        .with({ type: 'LOAD_RULE_FAILED' }, ({ error }) => {
            return singleton({ ...model, loading: false, error });
        })

        .with({ type: 'FORM_FIELD_UPDATED' }, ({ field, value }) => {
            return singleton({
                ...model,
                formData: { ...model.formData, [field]: value }
            });
        })

        .with({ type: 'SCOPE_FIELD_UPDATED' }, ({ field, value }) => {
            return singleton({
                ...model,
                formData: {
                    ...model.formData,
                    scope: { ...model.formData.scope, [field]: value }
                }
            });
        })

        .with({ type: 'PARAMETER_FIELD_UPDATED' }, ({ key, value }) => {
            return singleton({
                ...model,
                formData: {
                    ...model.formData,
                    parameters: { ...model.formData.parameters, [key]: value }
                }
            });
        })

        .with({ type: 'SAVE_RULE_REQUESTED' }, () => {
            return ret(
                { ...model, saving: true },
                Cmd.task({
                    task: async () => {
                        console.log('Saving rule...', model.formData);
                        return true;
                    },
                    onSuccess: () => ({ type: 'SAVE_RULE_SUCCEEDED' }),
                    onFailure: (err) => ({ type: 'SAVE_RULE_FAILED', error: err.message }),
                })
            );
        })

        .with({ type: 'SAVE_RULE_SUCCEEDED' }, () => {
            return ret({ ...model, saving: false }, Cmd.back());
        })

        .with({ type: 'SAVE_RULE_FAILED' }, ({ error }) => {
            return singleton({ ...model, saving: false, error });
        })

        .with({ type: 'RESET_FORM' }, () => {
            return singleton({
                ...model,
                formData: DEFAULT_FORM_DATA,
                editingRuleId: null,
                originalRule: null
            });
        })

        .with({ type: 'CREATE_RULE_REQUESTED' }, () => {
            // Not implemented in original code but defined in Msg
            return singleton(model);
        })

        .with({ type: 'ROUTER_GO' }, ({ url }) => {
            return ret(
                { ...model, formData: DEFAULT_FORM_DATA, editingRuleId: null, originalRule: null },
                Cmd.navigate(url)
            );
        })

        .with({ type: 'ROUTER_BACK' }, () => {
            return ret(model, Cmd.back());
        })
        .with({ type: 'NAVIGATE_TO_EDIT' }, ({ ruleId }) => {
            return ret(
                { ...model, editingRuleId: ruleId, loading: true },
                Cmd.batch([
                    Cmd.navigate(`/banker/rules/update?ruleId=${ruleId}`),
                    Cmd.sleep(0, { type: 'LOAD_RULE_REQUESTED', ruleId })
                ])
            );
        })
        .with({ type: 'NAVIGATE_TO_CREATE' }, () => {
            return ret(
                { ...model, formData: DEFAULT_FORM_DATA, editingRuleId: null, originalRule: null },
                Cmd.navigate('/banker/rules/update')
            );
        })

        .exhaustive();

    return [result.model, result.cmd];
};
