import { WebData } from '@/shared/core/remote.data';

export interface UserProfile {
    id: string;
    firstName: string;
    alias: string;
    zone: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface ProfileModel {
    user: WebData<UserProfile>;
    isLoggingOut: boolean;
}

export enum ProfileMsgType {
    INIT = 'INIT',
    FETCH_PROFILE_SUCCEEDED = 'FETCH_PROFILE_SUCCEEDED',
    FETCH_PROFILE_FAILED = 'FETCH_PROFILE_FAILED',
    LOGOUT_REQUESTED = 'LOGOUT_REQUESTED',
    NAVIGATE_TO = 'NAVIGATE_TO',
}

export type ProfileMsg =
    | { type: ProfileMsgType.INIT }
    | { type: ProfileMsgType.FETCH_PROFILE_SUCCEEDED; profile: UserProfile }
    | { type: ProfileMsgType.FETCH_PROFILE_FAILED; error: string }
    | { type: ProfileMsgType.LOGOUT_REQUESTED }
    | { type: ProfileMsgType.NAVIGATE_TO; route: string };

export const initialProfileModel: ProfileModel = {
    user: { type: 'NotAsked' },
    isLoggingOut: false,
};
