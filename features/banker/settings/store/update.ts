import { Cmd } from '@/shared/core/cmd';
import { UpdateResult } from '@/shared/core/engine';
import { Model, Msg, MsgType } from './types';
import { match, P } from 'ts-pattern';

// Mock services
const SecurityService = {
    changePassword: async (p: any) => [null, true],
};

const RulesService = {
    list: async (role: string) => [null, []],
    toggle: async (id: string, active: boolean) => [null, true],
};

export const initialState: Model = {
    user: null,
    security: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        loading: false,
        error: null,
    },
    preferences: {
        theme: 'light',
        language: 'es',
    },
    rules: {
        data: null,
        loading: false,
        error: null,
    },
    expandedSections: ['profile'],
};

// --- Cmd Creators ---

const changePasswordCmd = (p: any): Cmd =>
    Cmd.attempt({
        task: () => SecurityService.changePassword(p),
        onSuccess: () => ({ type: MsgType.CHANGE_PASSWORD_SUCCEEDED }),
        onFailure: (err) => ({ type: MsgType.CHANGE_PASSWORD_FAILED, error: err.message }),
    });

const fetchRulesCmd = (role?: string): Cmd =>
    Cmd.attempt({
        task: () => RulesService.list(role || 'banker'),
        onSuccess: (rules) => ({ type: MsgType.FETCH_RULES_SUCCEEDED, rules }),
        onFailure: (err) => ({ type: MsgType.FETCH_RULES_FAILED, error: err.message }),
    });

const toggleRuleCmd = (rule: any, checked: boolean): Cmd =>
    Cmd.attempt({
        task: () => RulesService.toggle(rule.id, checked),
        onSuccess: () => ({ type: MsgType.FETCH_RULES_REQUESTED }), // Refresh
        onFailure: (err) => ({ type: MsgType.FETCH_RULES_FAILED, error: err.message }),
    });

// --- Sub-updaters ---

const updateSecurity = (security: Model['security'], msg: Msg): [Model['security'], Cmd] =>
    match<Msg, [Model['security'], Cmd]>(msg)
        .with({ type: MsgType.SECURITY_FIELD_UPDATED }, ({ field, value }) => [
            { ...security, [field]: value } as Model['security'],
            Cmd.none
        ])
        .with({ type: MsgType.CHANGE_PASSWORD_REQUESTED }, () => [
            { ...security, loading: true, error: null } as Model['security'],
            changePasswordCmd(security)
        ])
        .with({ type: MsgType.CHANGE_PASSWORD_SUCCEEDED }, () => [
            { ...initialState.security } as Model['security'],
            Cmd.none
        ])
        .with({ type: MsgType.CHANGE_PASSWORD_FAILED }, ({ error }) => [
            { ...security, loading: false, error } as Model['security'],
            Cmd.none
        ])
        .otherwise(() => [security, Cmd.none]);

const updateRules = (rules: Model['rules'], msg: Msg, userRole?: string): [Model['rules'], Cmd] =>
    match<Msg, [Model['rules'], Cmd]>(msg)
        .with({ type: MsgType.FETCH_RULES_REQUESTED }, () => [
            { ...rules, loading: true, error: null } as Model['rules'],
            fetchRulesCmd(userRole)
        ])
        .with({ type: MsgType.FETCH_RULES_SUCCEEDED }, ({ rules: newRules }) => [
            { data: newRules, loading: false, error: null } as Model['rules'],
            Cmd.none
        ])
        .with({ type: MsgType.FETCH_RULES_FAILED }, ({ error }) => [
            { ...rules, loading: false, error } as Model['rules'],
            Cmd.none
        ])
        .with({ type: MsgType.TOGGLE_RULE_REQUESTED }, ({ rule, checked }) => {
            const updatedRules = rules.data?.map(r =>
                r.id === rule.id ? { ...r, isActivated: checked } : r
            ) || null;
            return [{ ...rules, data: updatedRules } as Model['rules'], toggleRuleCmd(rule, checked)];
        })
        .with({ type: MsgType.MODIFY_RULE_REQUESTED }, ({ rule }) => {
            return [rules, Cmd.navigate({
                pathname: '/banker/update_rule',
                params: { ruleId: rule.id }
            })] as [Model['rules'], Cmd];
        })
        .otherwise(() => [rules, Cmd.none]);

const updatePreferences = (model: Model, msg: Msg): [Model, Cmd] =>
    match<Msg, [Model, Cmd]>(msg)
        .with({ type: MsgType.THEME_TOGGLED }, () => {
            const nextTheme = model.preferences.theme === 'light' ? 'dark' : 'light';
            return [{ ...model, preferences: { ...model.preferences, theme: nextTheme } } as Model, Cmd.none];
        })
        .with({ type: MsgType.LANGUAGE_CHANGED }, ({ language }) => [
            { ...model, preferences: { ...model.preferences, language } } as Model,
            Cmd.none
        ])
        .with({ type: MsgType.TOGGLE_SECTION }, ({ sectionId }) => {
            const isExpanded = model.expandedSections.includes(sectionId);
            const newSections = isExpanded
                ? model.expandedSections.filter(id => id !== sectionId)
                : [...model.expandedSections, sectionId];
            return [{ ...model, expandedSections: newSections } as Model, Cmd.none];
        })
        .otherwise(() => [model, Cmd.none]);

// --- Main Update ---

export const update = (model: Model, msg: Msg): UpdateResult<Model, Msg> =>
    match<Msg, UpdateResult<Model, Msg>>(msg)
        .with({ type: MsgType.SET_USER_DATA }, ({ user }) => [
            { ...model, user } as Model,
            Cmd.none
        ])
        .with(
            {
                type: P.union(
                    MsgType.SECURITY_FIELD_UPDATED,
                    MsgType.CHANGE_PASSWORD_REQUESTED,
                    MsgType.CHANGE_PASSWORD_SUCCEEDED,
                    MsgType.CHANGE_PASSWORD_FAILED
                )
            },
            (m) => {
                const [nextSecurity, securityCmd] = updateSecurity(model.security, m as Msg);
                return [{ ...model, security: nextSecurity } as Model, securityCmd];
            }
        )
        .with(
            {
                type: P.union(
                    MsgType.FETCH_RULES_REQUESTED,
                    MsgType.FETCH_RULES_SUCCEEDED,
                    MsgType.FETCH_RULES_FAILED,
                    MsgType.TOGGLE_RULE_REQUESTED,
                    MsgType.MODIFY_RULE_REQUESTED
                )
            },
            (m) => {
                const [nextRules, rulesCmd] = updateRules(model.rules, m as Msg, model.user?.role);
                return [{ ...model, rules: nextRules } as Model, rulesCmd];
            }
        )
        .with(
            {
                type: P.union(
                    MsgType.THEME_TOGGLED,
                    MsgType.LANGUAGE_CHANGED,
                    MsgType.TOGGLE_SECTION
                )
            },
            (m) => updatePreferences(model, m as Msg)
        )
        .with({ type: MsgType.ROUTER_BACK }, () => {
            return [model, Cmd.navigate({ pathname: '', method: 'back' })];
        })
        .exhaustive();
