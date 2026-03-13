import { createMsg } from '@core/tea-utils';

/**
 * Mensajes globales (Señales) definidos para la comunicación entre módulos.
 * Se utilizan vía Cmd.sendMsg y Sub.receiveMsg.
 */
export const GLOBAL_LOGOUT = createMsg<'LOGOUT'>('LOGOUT');
export const DASHBOARD_FILTER_CHANGED = createMsg<'DASHBOARD_FILTER_CHANGED', string>('DASHBOARD_FILTER_CHANGED');


export const GLOBAL = createMsg<'GLOBAL', typeof GLOBAL_LOGOUT._type>('GLOBAL');

export const GlobalSignals = {
    LOGOUT: GLOBAL_LOGOUT,
    DASHBOARD_FILTER_CHANGED,
} as const;
