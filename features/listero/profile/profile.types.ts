import { WebData } from '@/shared/core/remote.data';

export interface UserProfile {
    id: string;
    firstName: string;
    alias: string;
    zone: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface Incident {
    id: number;
    reporter: number;
    reporter_name: string;
    structure: number;
    structure_name: string;
    draw: number | null;
    draw_name: string | null;
    incident_type: string;
    description: string;
    status: 'pending' | 'in_review' | 'resolved' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface ChangePasswordSession {
    newPin: string;
    confirmPin: string;
    status: 'idle' | 'submitting' | 'success' | 'failure';
    error: string | null;
}

export interface ProfileModel {
    user: WebData<UserProfile>;
    incidents: WebData<Incident[]>;
    isLoggingOut: boolean;
    changePasswordSession: ChangePasswordSession;
}

export enum ProfileMsgType {
    INIT = 'INIT',
    FETCH_PROFILE_SUCCEEDED = 'FETCH_PROFILE_SUCCEEDED',
    FETCH_PROFILE_FAILED = 'FETCH_PROFILE_FAILED',
    FETCH_INCIDENTS_REQUESTED = 'FETCH_INCIDENTS_REQUESTED',
    FETCH_INCIDENTS_SUCCEEDED = 'FETCH_INCIDENTS_SUCCEEDED',
    FETCH_INCIDENTS_FAILED = 'FETCH_INCIDENTS_FAILED',
    LOGOUT_REQUESTED = 'LOGOUT_REQUESTED',
    NAVIGATE_TO = 'NAVIGATE_TO',
    CHANGE_PASSWORD_REQUESTED = 'CHANGE_PASSWORD_REQUESTED',
    NEW_PIN_CHANGED = 'NEW_PIN_CHANGED',
    CONFIRM_PIN_CHANGED = 'CONFIRM_PIN_CHANGED',
    SUBMIT_CHANGE_PASSWORD = 'SUBMIT_CHANGE_PASSWORD',
    CHANGE_PASSWORD_SUCCEEDED = 'CHANGE_PASSWORD_SUCCEEDED',
    CHANGE_PASSWORD_FAILED = 'CHANGE_PASSWORD_FAILED',
    RESET_CHANGE_PASSWORD = 'RESET_CHANGE_PASSWORD',
}

export type ProfileMsg =
    | { type: ProfileMsgType.INIT }
    | { type: ProfileMsgType.FETCH_PROFILE_SUCCEEDED; profile: UserProfile }
    | { type: ProfileMsgType.FETCH_PROFILE_FAILED; error: string }
    | { type: ProfileMsgType.FETCH_INCIDENTS_REQUESTED }
    | { type: ProfileMsgType.FETCH_INCIDENTS_SUCCEEDED; incidents: Incident[] }
    | { type: ProfileMsgType.FETCH_INCIDENTS_FAILED; error: string }
    | { type: ProfileMsgType.LOGOUT_REQUESTED }
    | { type: ProfileMsgType.NAVIGATE_TO; route: string; params?: Record<string, any> }
    | { type: ProfileMsgType.CHANGE_PASSWORD_REQUESTED }
    | { type: ProfileMsgType.NEW_PIN_CHANGED; pin: string }
    | { type: ProfileMsgType.CONFIRM_PIN_CHANGED; pin: string }
    | { type: ProfileMsgType.SUBMIT_CHANGE_PASSWORD }
    | { type: ProfileMsgType.CHANGE_PASSWORD_SUCCEEDED }
    | { type: ProfileMsgType.CHANGE_PASSWORD_FAILED; error: string }
    | { type: ProfileMsgType.RESET_CHANGE_PASSWORD };

export const initialProfileModel: ProfileModel = {
    user: { type: 'NotAsked' },
    incidents: { type: 'NotAsked' },
    isLoggingOut: false,
    changePasswordSession: {
        newPin: '',
        confirmPin: '',
        status: 'idle',
        error: null,
    },
};
