import { match } from 'ts-pattern';
import { Model, initialState, ruleToFormData, RuleUpdateFormData } from './model';
import { Msg } from './msg';
import { Cmds } from './cmds';
import { singleton, ret, Sub, SubDescriptor, Cmd, RemoteData } from '@core/tea-utils';

/**
 * 🧪 VALIDATION UTILITIES
 * Pure validation functions with specific error messages
 */

interface ValidationErrors {
    name?: string;
    description?: string;
    category?: string;
    status?: string;
    scope?: string;
    validationType?: string;
    parameters?: string;
}

const validateRuleForm = (formData: RuleUpdateFormData): { isValid: boolean; errors: ValidationErrors } => {
    const errors: ValidationErrors = {};

    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
        errors.name = 'El nombre de la regla es requerido';
    } else if (formData.name.length < 3) {
        errors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.length > 100) {
        errors.name = 'El nombre no puede exceder 100 caracteres';
    }

    // Description validation
    if (!formData.description || formData.description.trim().length === 0) {
        errors.description = 'La descripción es requerida';
    } else if (formData.description.length < 10) {
        errors.description = 'La descripción debe tener al menos 10 caracteres';
    } else if (formData.description.length > 500) {
        errors.description = 'La descripción no puede exceder 500 caracteres';
    }

    // Category validation
    const validCategories = ['payment_validation', 'draw_validation', 'user_validation', 'financial_limits', 'compliance', 'custom'];
    if (!formData.category || !validCategories.includes(formData.category)) {
        errors.category = 'La categoría seleccionada no es válida';
    }

    // Status validation
    const validStatuses = ['active', 'inactive', 'draft'];
    if (!formData.status || !validStatuses.includes(formData.status)) {
        errors.status = 'El estado seleccionado no es válido';
    }

    // Scope validation
    if (!formData.scope) {
        errors.scope = 'El alcance de la regla es requerido';
    }

    // Validation type validation
    const validTypes = ['range_check', 'format_validation', 'business_rule', 'cross_reference', 'custom_logic'];
    if (!formData.validationType || !validTypes.includes(formData.validationType)) {
        errors.validationType = 'El tipo de validación seleccionado no es válido';
    }

    // Parameters validation (basic)
    if (!formData.parameters || typeof formData.parameters !== 'object') {
        errors.parameters = 'Los parámetros de la regla son requeridos';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * 🔄 UPDATE FUNCTION
 * Pure function that handles state transitions and declares side effects.
 * Using RemoteData to avoid inconsistent/impossible states.
 */

export const init = (): [Model, any] => {
    return [initialState, Cmd.none];
};

export const subscriptions = (_model: Model): SubDescriptor<Msg> => {
    // We only need auth synchronization if it's strictly necessary for the logic.
    // Otherwise, it's better to keep it as a separate global store.
    return Sub.none();
};

export const update = (model: Model, msg: Msg): [Model, any] => {
    return match<Msg, any>(msg)
        .with({ type: 'INIT_SCREEN' }, ({ id_structure, ruleId }) => {
            const nextModel = {
                ...model,
                id_structure: id_structure || null,
            };

            const cmds = [];

            if (id_structure) {
                cmds.push(Cmds.fetchStructureRules(id_structure));
                nextModel.rules = RemoteData.loading();
            } else if (!ruleId) {
                // If no ruleId, we probably want all user rules
                cmds.push(Cmds.fetchCurrentUserRules());
                nextModel.rules = RemoteData.loading();
            }

            if (ruleId) {
                cmds.push(Cmds.loadRule(nextModel, ruleId));
                nextModel.editing = RemoteData.loading();
            }

            return ret(nextModel, Cmd.batch(cmds));
        })
        .with({ type: 'FETCH_RULES_REQUESTED' }, () => {
            return ret(
                { ...model, rules: RemoteData.loading() },
                model.id_structure ? Cmds.fetchStructureRules(model.id_structure) : Cmds.fetchCurrentUserRules()
            );
        })
        .with({ type: 'FETCH_RULES_SUCCEEDED' }, ({ rules }) => {
            return singleton({ ...model, rules: RemoteData.success(rules) });
        })
        .with({ type: 'FETCH_RULES_FAILED' }, ({ error }) => {
            return singleton({ ...model, rules: RemoteData.failure(error) });
        })
        .with({ type: 'TOGGLE_RULE_REQUESTED' }, ({ ruleId, ruleType }) => {
            return singleton({
                ...model,
                confirmToggle: { ruleId, ruleType }
            });
        })
        .with({ type: 'TOGGLE_RULE_CANCELLED' }, () => {
            return singleton({
                ...model,
                confirmToggle: null
            });
        })
        .with({ type: 'TOGGLE_RULE_CONFIRMED' }, ({ ruleId, ruleType }) => {
            const currentStatus = RemoteData.fold({
                notAsked: () => 'inactive',
                loading: () => 'inactive',
                failure: () => 'inactive',
                success: (rules) => rules.find(r => r.id === ruleId)?.status || 'inactive'
            }, model.rules);

            return ret(
                { ...model, saving: RemoteData.loading(), confirmToggle: null },
                Cmds.toggleRule(model, ruleId, currentStatus)
            );
        })
        .with({ type: 'LOAD_RULE_REQUESTED' }, ({ ruleId }) => {
            return ret(
                { ...model, editing: RemoteData.loading() },
                Cmds.loadRule(model, ruleId)
            );
        })
        .with({ type: 'LOAD_RULE_SUCCEEDED' }, ({ rule }) => {
            return singleton({
                ...model,
                editing: RemoteData.success({
                    id: rule.id,
                    formData: ruleToFormData(rule)
                }),
                validationErrors: {},
            });
        })
        .with({ type: 'LOAD_RULE_FAILED' }, ({ error }) => {
            return singleton({ ...model, editing: RemoteData.failure(error) });
        })
        .with({ type: 'FORM_FIELD_UPDATED' }, ({ field, value }) => {
            const nextEditing = RemoteData.map(
                (editing) => ({
                    ...editing,
                    formData: { ...editing.formData, [field]: value }
                }),
                model.editing
            );
            const nextValidationErrors = {
                ...model.validationErrors,
                name: field === 'name' ? undefined : model.validationErrors.name,
                description: field === 'description' ? undefined : model.validationErrors.description,
                category: field === 'category' ? undefined : model.validationErrors.category,
                status: field === 'status' ? undefined : model.validationErrors.status,
                scope: field === 'scope' ? undefined : model.validationErrors.scope,
                validationType: field === 'validationType' ? undefined : model.validationErrors.validationType,
                parameters: field === 'parameters' ? undefined : model.validationErrors.parameters,
            };
            return singleton({ ...model, editing: nextEditing, validationErrors: nextValidationErrors });
        })
        .with({ type: 'SCOPE_FIELD_UPDATED' }, ({ field, value }) => {
            const nextEditing = RemoteData.map(
                (editing) => ({
                    ...editing,
                    formData: {
                        ...editing.formData,
                        scope: { ...editing.formData.scope, [field]: value }
                    }
                }),
                model.editing
            );
            return singleton({ ...model, editing: nextEditing, validationErrors: { ...model.validationErrors, scope: undefined } });
        })
        .with({ type: 'PARAMETER_FIELD_UPDATED' }, ({ key, value }) => {
            const nextEditing = RemoteData.map(
                (editing) => ({
                    ...editing,
                    formData: {
                        ...editing.formData,
                        parameters: { ...editing.formData.parameters, [key]: value }
                    }
                }),
                model.editing
            );
            return singleton({ ...model, editing: nextEditing, validationErrors: { ...model.validationErrors, parameters: undefined } });
        })
        .with({ type: 'SAVE_RULE_REQUESTED' }, () => {
            const editingData = RemoteData.fold({
                notAsked: () => null,
                loading: () => null,
                failure: () => null,
                success: (data) => data
            }, model.editing);

            if (!editingData) return singleton(model);

            const validation = validateRuleForm(editingData.formData);
            if (!validation.isValid) {
                return singleton({
                    ...model,
                    validationErrors: validation.errors,
                });
            }

            return ret(
                { ...model, saving: RemoteData.loading(), validationErrors: {} },
                Cmds.saveRule(editingData.id, editingData.formData, model.id_structure)
            );
        })
        .with({ type: 'SAVE_RULE_SUCCEEDED' }, () => {
            const nextModel = { ...model, saving: RemoteData.success(undefined), validationErrors: {} };
            const refreshCmd = model.id_structure
                ? Cmds.fetchStructureRules(model.id_structure)
                : Cmds.fetchCurrentUserRules();

            return ret(nextModel, Cmd.batch([refreshCmd, Cmds.navigateBack()]));
        })
        .with({ type: 'SAVE_RULE_FAILED' }, ({ error }) => {
            return singleton({ ...model, saving: RemoteData.failure(error) });
        })
        .with({ type: 'RESET_FORM' }, () => {
            return singleton({ ...model, editing: RemoteData.notAsked() });
        })
        .with({ type: 'ROUTER_BACK' }, () => {
            return ret(model, Cmds.navigateBack());
        })
        .with({ type: 'NAVIGATE_TO_EDIT' }, ({ ruleId }) => {
            return ret(model, Cmds.navigateToEdit(ruleId));
        })
        .with({ type: 'NAVIGATE_TO_RULE_UPDATE' }, ({ ruleId }) => {
            return ret(model, Cmds.navigateToRuleUpdate(ruleId));
        })
        .with({ type: 'NAVIGATE_TO_CREATE' }, () => {
            return ret(model, Cmds.navigateToCreate());
        })
        .with({ type: 'ROUTER_GO' }, ({ url }) => {
            return ret(model, Cmd.navigate(url));
        })
        .otherwise(() => singleton(model));
};
