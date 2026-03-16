import { createMsg } from '../../../../shared/core/tea-utils';

export const USERNAME_UPDATED = createMsg<'USERNAME_UPDATED', { username: string }>('USERNAME_UPDATED');
export const PIN_UPDATED = createMsg<'PIN_UPDATED', { pin: string }>('PIN_UPDATED');
export const HYDRATION_STARTED = createMsg<'HYDRATION_STARTED'>('HYDRATION_STARTED');
export const HYDRATION_COMPLETED = createMsg<'HYDRATION_COMPLETED', { username: string }>('HYDRATION_COMPLETED');
export const RESET_LOGIN_UI = createMsg<'RESET_LOGIN_UI'>('RESET_LOGIN_UI');
export const EDIT_USERNAME_TOGGLED = createMsg<'EDIT_USERNAME_TOGGLED', { isEditing: boolean }>('EDIT_USERNAME_TOGGLED');
export const LOGIN_TRIGGERED = createMsg<'LOGIN_TRIGGERED', { username: string; pin: string }>('LOGIN_TRIGGERED');

export type LoginMsg =
    | ReturnType<typeof USERNAME_UPDATED>
    | ReturnType<typeof PIN_UPDATED>
    | ReturnType<typeof HYDRATION_STARTED>
    | ReturnType<typeof HYDRATION_COMPLETED>
    | ReturnType<typeof RESET_LOGIN_UI>
    | ReturnType<typeof EDIT_USERNAME_TOGGLED>
    | ReturnType<typeof LOGIN_TRIGGERED>;
