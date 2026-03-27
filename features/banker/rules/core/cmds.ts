import { Cmd, RemoteDataHttp, WebData } from '@core/tea-utils';
import { match } from 'ts-pattern';
import { ValidationRuleRepository } from '@/shared/repositories/validation_rule';
import { routes } from '@/config/routes';
import { Model, RuleUpdateFormData } from './model';
import { Msg, FETCH_RULES_SUCCEEDED, FETCH_RULES_FAILED, LOAD_RULE_SUCCEEDED, LOAD_RULE_FAILED, SAVE_RULE_SUCCEEDED, SAVE_RULE_FAILED } from './msg';
import { ValidationRule } from '@/types/rules';

/**
 * 🛠️ RULE COMMANDS
 * Centralizes all side effects for Rules.
 * Uses RemoteDataHttp for consistent WebData flow.
 */

export const Cmds = {
    fetchStructureRules: (id_structure: string): Cmd =>
        RemoteDataHttp.fetch(
            () => ValidationRuleRepository.getByStructure(id_structure),
            (data: WebData<ValidationRule[]>) =>
                match(data)
                    .with({ type: 'Success' }, ({ data: rules }) => FETCH_RULES_SUCCEEDED(rules))
                    .with({ type: 'Failure' }, ({ error }) => FETCH_RULES_FAILED(String(error)))
                    .with({ type: 'Loading' }, () => FETCH_RULES_FAILED('Cargando reglas de la estructura...'))
                    .with({ type: 'NotAsked' }, () => FETCH_RULES_FAILED('No se han solicitado las reglas de la estructura'))
                    .exhaustive(),
            'FETCH_STRUCTURE_RULES'
        ),

    fetchCurrentUserRules: (): Cmd =>
        RemoteDataHttp.fetch(
            () => ValidationRuleRepository.getForCurrentUser(true),
            (data: WebData<ValidationRule[]>) =>
                match(data)
                    .with({ type: 'Success' }, ({ data: rules }) => FETCH_RULES_SUCCEEDED(rules))
                    .with({ type: 'Failure' }, ({ error }) => FETCH_RULES_FAILED(String(error)))
                    .with({ type: 'Loading' }, () => FETCH_RULES_FAILED('Cargando reglas del usuario...'))
                    .with({ type: 'NotAsked' }, () => FETCH_RULES_FAILED('No se han solicitado las reglas del usuario'))
                    .exhaustive(),
            'FETCH_USER_RULES'
        ),

    loadRule: (model: Model, ruleId: string): Cmd =>
        RemoteDataHttp.fetch(
            async () => {
                // 1. Intentar buscar en reglas de la estructura
                if (model.id_structure) {
                    const structureRules = await ValidationRuleRepository.getByStructure(model.id_structure);
                    const rule = structureRules.find((r) => String(r.id) === String(ruleId));
                    if (rule) return rule;

                    // 2. Intentar buscar en templates disponibles
                    const templates = await ValidationRuleRepository.getAvailableTemplates();
                    const template = templates.find((t) => String(t.id) === String(ruleId));
                    if (template) return template;
                }

                // 3. Fallback: buscar en reglas del usuario actual
                const userRules = await ValidationRuleRepository.getForCurrentUser(true);
                const userRule = userRules.find((r) => String(r.id) === String(ruleId));

                if (!userRule) throw new Error(`Regla con ID ${ruleId} no encontrada`);
                return userRule;
            },
            (data: WebData<ValidationRule>) =>
                match(data)
                    .with({ type: 'Success' }, ({ data: rule }) => LOAD_RULE_SUCCEEDED(rule))
                    .with({ type: 'Failure' }, ({ error }) => LOAD_RULE_FAILED(String(error)))
                    .with({ type: 'Loading' }, () => LOAD_RULE_FAILED('Cargando detalle de la regla...'))
                    .with({ type: 'NotAsked' }, () => LOAD_RULE_FAILED('No se ha solicitado el detalle de la regla'))
                    .exhaustive(),
            'LOAD_RULE'
        ),

    toggleRule: (model: Model, ruleId: string, currentStatus: string): Cmd =>
        RemoteDataHttp.fetch(
            async () => {
                const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
                return ValidationRuleRepository.updateStructureRule(ruleId, { status: newStatus as any });
            },
            (data: WebData<any>) =>
                match(data)
                    .with({ type: 'Success' }, () => SAVE_RULE_SUCCEEDED())
                    .with({ type: 'Failure' }, ({ error }) => SAVE_RULE_FAILED(String(error)))
                    .otherwise(() => SAVE_RULE_FAILED('Actualizando estado...')),
            'TOGGLE_RULE'
        ),

    saveRule: (ruleId: string | null, formData: RuleUpdateFormData, id_structure: string | null): Cmd =>
        RemoteDataHttp.fetch(
            async () => {
                if (!ruleId) return; // O manejar creación si fuera necesario

                const updates: Partial<ValidationRule> = {
                    ...formData,
                    status: formData.status as any,
                };
                return ValidationRuleRepository.updateStructureRule(ruleId, updates);
            },
            (data: WebData<any>) =>
                match(data)
                    .with({ type: 'Success' }, () => SAVE_RULE_SUCCEEDED())
                    .with({ type: 'Failure' }, ({ error }) => SAVE_RULE_FAILED(String(error)))
                    .with({ type: 'Loading' }, () => SAVE_RULE_FAILED('Guardando cambios en la regla...'))
                    .with({ type: 'NotAsked' }, () => SAVE_RULE_FAILED('No se han solicitado cambios en la regla'))
                    .exhaustive(),
            'SAVE_RULE'
        ),

    navigateBack: (): Cmd => Cmd.navigate('../'),
    navigateToRuleUpdate: (ruleId: string): Cmd =>
        Cmd.navigate({
            pathname: routes.banker.rule_update.screen,
            params: { id: ruleId },
        }),
    navigateToEdit: (ruleId: string): Cmd => Cmds.navigateToRuleUpdate(ruleId),
    navigateToCreate: (): Cmd => Cmd.navigate('./create'),
};
