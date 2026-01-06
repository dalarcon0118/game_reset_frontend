export interface Model {
    user: {
        name: string;
        email: string;
        role: string;
    } | null;
    security: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
        loading: boolean;
        error: string | null;
    };
    preferences: {
        theme: 'light' | 'dark';
        language: string;
    };
    rules: {
        data: any[] | null;
        loading: boolean;
        error: string | null;
    };
    expandedSections: string[];
}

export enum MsgType {
    SET_USER_DATA = 'SET_USER_DATA',
    TOGGLE_SECTION = 'TOGGLE_SECTION',
    SECURITY_FIELD_UPDATED = 'SECURITY_FIELD_UPDATED',
    CHANGE_PASSWORD_REQUESTED = 'CHANGE_PASSWORD_REQUESTED',
    CHANGE_PASSWORD_SUCCEEDED = 'CHANGE_PASSWORD_SUCCEEDED',
    CHANGE_PASSWORD_FAILED = 'CHANGE_PASSWORD_FAILED',
    THEME_TOGGLED = 'THEME_TOGGLED',
    LANGUAGE_CHANGED = 'LANGUAGE_CHANGED',
    FETCH_RULES_REQUESTED = 'FETCH_RULES_REQUESTED',
    FETCH_RULES_SUCCEEDED = 'FETCH_RULES_SUCCEEDED',
    FETCH_RULES_FAILED = 'FETCH_RULES_FAILED',
    TOGGLE_RULE_REQUESTED = 'TOGGLE_RULE_REQUESTED',
    MODIFY_RULE_REQUESTED = 'MODIFY_RULE_REQUESTED',
    ROUTER_BACK = 'ROUTER_BACK',
}

export type Msg =
    | { type: MsgType.SET_USER_DATA; user: Model['user'] }
    | { type: MsgType.TOGGLE_SECTION; sectionId: string }
    | { type: MsgType.SECURITY_FIELD_UPDATED; field: keyof Model['security']; value: string }
    | { type: MsgType.CHANGE_PASSWORD_REQUESTED }
    | { type: MsgType.CHANGE_PASSWORD_SUCCEEDED }
    | { type: MsgType.CHANGE_PASSWORD_FAILED; error: string }
    | { type: MsgType.THEME_TOGGLED }
    | { type: MsgType.LANGUAGE_CHANGED; language: string }
    | { type: MsgType.FETCH_RULES_REQUESTED }
    | { type: MsgType.FETCH_RULES_SUCCEEDED; rules: any[] }
    | { type: MsgType.FETCH_RULES_FAILED; error: string }
    | { type: MsgType.TOGGLE_RULE_REQUESTED; rule: any; checked: boolean }
    | { type: MsgType.MODIFY_RULE_REQUESTED; rule: any }
    | { type: MsgType.ROUTER_BACK };

export const SET_USER_DATA = (user: Model['user']) => ({ type: MsgType.SET_USER_DATA, user } as const);
export const TOGGLE_SECTION = (sectionId: string) => ({ type: MsgType.TOGGLE_SECTION, sectionId } as const);
export const SECURITY_FIELD_UPDATED = (field: keyof Model['security'], value: string) => ({ type: MsgType.SECURITY_FIELD_UPDATED, field, value } as const);
export const CHANGE_PASSWORD_REQUESTED = () => ({ type: MsgType.CHANGE_PASSWORD_REQUESTED } as const);
export const CHANGE_PASSWORD_SUCCEEDED = () => ({ type: MsgType.CHANGE_PASSWORD_SUCCEEDED } as const);
export const CHANGE_PASSWORD_FAILED = (error: string) => ({ type: MsgType.CHANGE_PASSWORD_FAILED, error } as const);
export const THEME_TOGGLED = () => ({ type: MsgType.THEME_TOGGLED } as const);
export const LANGUAGE_CHANGED = (language: string) => ({ type: MsgType.LANGUAGE_CHANGED, language } as const);
export const FETCH_RULES_REQUESTED = () => ({ type: MsgType.FETCH_RULES_REQUESTED } as const);
export const FETCH_RULES_SUCCEEDED = (rules: any[]) => ({ type: MsgType.FETCH_RULES_SUCCEEDED, rules } as const);
export const FETCH_RULES_FAILED = (error: string) => ({ type: MsgType.FETCH_RULES_FAILED, error } as const);
export const TOGGLE_RULE_REQUESTED = (rule: any, checked: boolean) => ({ type: MsgType.TOGGLE_RULE_REQUESTED, rule, checked } as const);
export const MODIFY_RULE_REQUESTED = (rule: any) => ({ type: MsgType.MODIFY_RULE_REQUESTED, rule } as const);
export const ROUTER_BACK = () => ({ type: MsgType.ROUTER_BACK } as const);
