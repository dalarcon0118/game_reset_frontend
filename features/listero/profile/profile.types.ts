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
    userData: UserProfile;
    incidents: WebData<Incident[]>;
    isLoggingOut: boolean;
    changePasswordSession: ChangePasswordSession;
}

export enum ProfileMsgType {
    INIT = 'INIT',
    FETCH_PROFILE_RESPONSE = 'FETCH_PROFILE_RESPONSE',
    FETCH_INCIDENTS_REQUESTED = 'FETCH_INCIDENTS_REQUESTED',
    FETCH_INCIDENTS_RESPONSE = 'FETCH_INCIDENTS_RESPONSE',
    LOGOUT_REQUESTED = 'LOGOUT_REQUESTED',
    SUBMIT_LOGOUT = 'SUBMIT_LOGOUT',
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
    | { type: ProfileMsgType.FETCH_PROFILE_RESPONSE; webData: WebData<UserProfile> }
    | { type: ProfileMsgType.FETCH_INCIDENTS_REQUESTED }
    | { type: ProfileMsgType.FETCH_INCIDENTS_RESPONSE; webData: WebData<Incident[]> }
    | { type: ProfileMsgType.LOGOUT_REQUESTED }
    | { type: ProfileMsgType.SUBMIT_LOGOUT }
    | { type: ProfileMsgType.NAVIGATE_TO; route: string; params?: Record<string, any> }
    | { type: ProfileMsgType.CHANGE_PASSWORD_REQUESTED }
    | { type: ProfileMsgType.NEW_PIN_CHANGED; pin: string }
    | { type: ProfileMsgType.CONFIRM_PIN_CHANGED; pin: string }
    | { type: ProfileMsgType.SUBMIT_CHANGE_PASSWORD }
    | { type: ProfileMsgType.CHANGE_PASSWORD_SUCCEEDED }
    | { type: ProfileMsgType.CHANGE_PASSWORD_FAILED; error: string }
    | { type: ProfileMsgType.RESET_CHANGE_PASSWORD };

export const DEFAULT_USER_PROFILE: UserProfile = {
    id: '',
    firstName: 'Usuario',
    alias: '',
    zone: '',
    status: 'ACTIVE',
};

export const initialProfileModel: ProfileModel = {
    user: { type: 'NotAsked' },
    userData: DEFAULT_USER_PROFILE,
    incidents: { type: 'NotAsked' },
    isLoggingOut: false,
    changePasswordSession: {
        newPin: '',
        confirmPin: '',
        status: 'idle',
        error: null,
    },
};
