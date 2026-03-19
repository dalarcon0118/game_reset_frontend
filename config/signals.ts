import { createMsg } from '@core/tea-utils';

/**
 * Mensajes globales (Señales) definidos para la comunicación entre módulos.
 * Se utilizan vía Cmd.sendMsg y Sub.receiveMsg.
 */
export const GLOBAL_LOGOUT = createMsg<'LOGOUT'>('LOGOUT');
export const GLOBAL_LOGIN = createMsg<'LOGIN', { username: string; pin: string }>('LOGIN');
export const DASHBOARD_FILTER_CHANGED = createMsg<'DASHBOARD_FILTER_CHANGED', string>('DASHBOARD_FILTER_CHANGED');
export const DASHBOARD_RULES_CLICKED = createMsg<'DASHBOARD_RULES_CLICKED', string | number>('DASHBOARD_RULES_CLICKED');
export const DASHBOARD_REWARDS_CLICKED = createMsg<'DASHBOARD_REWARDS_CLICKED', { id: string | number; title: string }>('DASHBOARD_REWARDS_CLICKED');
export const DASHBOARD_REFRESH_CLICKED = createMsg<'DASHBOARD_REFRESH_CLICKED', void>('DASHBOARD_REFRESH_CLICKED');
export const SYSTEM_READY = createMsg<'SYSTEM_READY', { date: string }>('SYSTEM_READY');

export const GLOBAL = createMsg<'GLOBAL', typeof GLOBAL_LOGOUT._type>('GLOBAL');

export const GlobalSignals = {
    LOGOUT: GLOBAL_LOGOUT,
    LOGIN: GLOBAL_LOGIN,
    DASHBOARD_FILTER_CHANGED,
    DASHBOARD_RULES_CLICKED,
    DASHBOARD_REWARDS_CLICKED,
    DASHBOARD_REFRESH_CLICKED,
    SYSTEM_READY,
} as const;
